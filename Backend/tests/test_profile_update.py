"""Profile edits use the token owner and preserve authentication fields."""
import os
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault('DATABASE_URL', 'postgresql+psycopg2://test:test@localhost/unused')
os.environ.setdefault('SECRET_KEY', 'test-only')
os.environ.setdefault('OPENAI_API_KEY', 'unused')

from app.auth.controller import router
from app.core.exception_handlers import exception_handlers
from app.core.security import SecurityUtils
from app.db.base_class import Base
from app.db.database import get_db
from app.models import User

@pytest.fixture
def profile_api(tmp_path):
    engine = create_engine(f'sqlite:///{tmp_path / "profile.sqlite"}', connect_args={'check_same_thread': False})
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    with sessions() as db:
        db.add_all([User(id='owner', email='owner@example.test', name='Original', user_type='patient', avatar_url='https://example.test/avatar.png', password='unchanged'), User(id='other', email='other@example.test', name='Other', user_type='patient')])
        db.commit()
    app = FastAPI(exception_handlers=exception_handlers)
    app.include_router(router, prefix='/api')
    def get_session():
        with sessions() as db: yield db
    app.dependency_overrides[get_db] = get_session
    client = TestClient(app)
    client.headers['Authorization'] = f"Bearer {SecurityUtils.create_access_token({'sub': 'owner'})}"
    yield client, sessions
    engine.dispose()


def test_name_only_preserves_avatar_and_auth(profile_api):
    client, sessions = profile_api
    response = client.patch('/api/auth/me', json={'name': '  Updated Name  '})
    assert response.status_code == 200
    assert response.json()['data']['name'] == 'Updated Name'
    assert response.json()['data']['avatar_url'] == 'https://example.test/avatar.png'
    assert 'password' not in response.json()['data']
    assert client.get('/api/auth/me').json()['data']['name'] == 'Updated Name'
    with sessions() as db:
        user = db.get(User, 'owner')
        assert user.name == 'Updated Name'
        assert user.password == 'unchanged' and user.user_type == 'patient'
        assert not user.is_email_verified
        assert db.get(User, 'other').name == 'Other'


@pytest.mark.parametrize('payload', [
    {}, {'name': ''}, {'name': '  '}, {'name': 'a'}, {'name': 'a' * 101},
    {'name': 'Valid', 'id': 'other'}, {'name': 'Valid', 'user_type': 'admin'},
    {'name': 'Valid', 'is_email_verified': True}, {'name': 'Valid', 'password': 'new'},
    {'name': 'Valid', 'avatar_url': 'data:image/png;base64,bogus'},
])
def test_invalid_or_unauthorized_fields(profile_api, payload):
    client, sessions = profile_api
    assert client.patch('/api/auth/me', json=payload).status_code == 422
    with sessions() as db: assert db.get(User, 'owner').name == 'Original'


def test_auth_required(profile_api):
    client, _ = profile_api
    client.headers.pop('Authorization')
    assert client.patch('/api/auth/me', json={'name': 'Updated'}).status_code == 401
    assert client.patch('/api/auth/me', json={'name': 'Updated'}, headers={'Authorization': 'Bearer invalid'}).status_code == 401


def image_bytes(format='PNG', size=(32, 32)):
    from io import BytesIO
    from PIL import Image
    target = BytesIO()
    Image.new('RGB', size, 'blue').save(target, format=format)
    return target.getvalue()


@pytest.fixture
def avatar_store(tmp_path, monkeypatch):
    from app.core.config import config
    storage = tmp_path / 'persistent-volume' / 'avatars'
    monkeypatch.setattr(config, 'AVATAR_STORAGE_DIR', str(storage))
    monkeypatch.setattr(config, 'PUBLIC_BACKEND_URL', 'https://api.example.test')
    return storage


def test_upload_persists_and_is_publicly_served(profile_api, avatar_store):
    from io import BytesIO
    from PIL import Image
    from urllib.parse import urlsplit
    client, sessions = profile_api
    response = client.post('/api/auth/me/avatar', files={'avatar': ('../../unsafe.png', image_bytes(), 'image/png')})
    assert response.status_code == 200
    url = response.json()['data']['avatar_url']
    assert url.startswith('https://api.example.test/api/auth/avatars/')
    assert 'unsafe' not in url
    with sessions() as db:
        assert db.get(User, 'owner').avatar_url == url
        assert db.get(User, 'other').avatar_url is None
    client.headers.pop('Authorization')
    served = client.get(urlsplit(url).path)
    assert served.status_code == 200
    assert served.headers['content-type'] == 'image/webp'
    assert served.headers['x-content-type-options'] == 'nosniff'
    with Image.open(BytesIO(served.content)) as image:
        assert image.format == 'WEBP' and image.size == (32, 32)
    # A new app/client reads the same persistent directory without in-memory state.
    app = FastAPI()
    app.include_router(router, prefix='/api')
    assert TestClient(app).get(urlsplit(url).path).content == served.content
    assert len(list(avatar_store.iterdir())) == 1


@pytest.mark.parametrize('content,mime', [
    (b'not an image', 'image/png'),
    (b'<svg/>', 'image/svg+xml'),
    (b'', 'image/png'),
    (b'x' * (2 * 1024 * 1024 + 1), 'image/png'),
])
def test_bad_upload_preserves_current_avatar(profile_api, avatar_store, content, mime):
    client, sessions = profile_api
    assert client.post('/api/auth/me/avatar', files={'avatar': ('image.png', content, mime)}).status_code == 422
    with sessions() as db:
        assert db.get(User, 'owner').avatar_url == 'https://example.test/avatar.png'
    assert not avatar_store.exists()


def test_upload_checks_actual_image_type(profile_api, avatar_store):
    client, _ = profile_api
    assert client.post('/api/auth/me/avatar', files={'avatar': ('image.jpg', image_bytes(), 'image/jpeg')}).status_code == 422


def test_upload_size_normalization(profile_api, avatar_store):
    from PIL import Image
    client, _ = profile_api
    response = client.post('/api/auth/me/avatar', files={'avatar': ('large.png', image_bytes(size=(2048, 1024)), 'image/png')})
    assert response.status_code == 200
    with Image.open(next(avatar_store.iterdir())) as image:
        assert image.size == (1024, 512)


def test_avatar_requires_auth(profile_api, avatar_store):
    client, _ = profile_api
    client.headers.pop('Authorization')
    assert client.post('/api/auth/me/avatar', files={'avatar': ('image.png', image_bytes(), 'image/png')}).status_code == 401
    assert not avatar_store.exists()


def test_failed_db_commit_removes_new_upload(profile_api, avatar_store):
    from unittest.mock import patch
    client, sessions = profile_api
    def failed_session():
        with sessions() as db:
            with patch.object(db, 'commit', side_effect=RuntimeError('Commit failed')):
                yield db
    client.app.dependency_overrides[get_db] = failed_session
    with pytest.raises(RuntimeError, match='Commit failed'):
        client.post('/api/auth/me/avatar', files={'avatar': ('image.png', image_bytes(), 'image/png')})
    assert list(avatar_store.iterdir()) == []
    with sessions() as db:
        assert db.get(User, 'owner').avatar_url == 'https://example.test/avatar.png'


def test_unknown_avatar_is_not_found(profile_api, avatar_store):
    client, _ = profile_api
    assert client.get('/api/auth/avatars/not-an-avatar.png').status_code == 404
    assert client.get('/api/auth/avatars/' + 'a' * 32 + '.webp').status_code == 404


@pytest.mark.parametrize('linked', [False, True])
def test_google_login_preserves_saved_profile(profile_api, monkeypatch, linked):
    import asyncio
    from unittest.mock import AsyncMock
    from app.auth.service import AuthService
    client, sessions = profile_api
    assert client.patch('/api/auth/me', json={'name': 'Chosen Name'}).status_code == 200
    monkeypatch.setattr(SecurityUtils, 'exchange_google_code', AsyncMock(return_value={'access_token': 'stub'}))
    monkeypatch.setattr(SecurityUtils, 'get_google_user_info', AsyncMock(return_value={
        'id': 'google-owner', 'email': 'owner@example.test', 'name': 'Google Name', 'picture': 'https://google.example/new.png',
    }))
    with sessions() as db:
        if linked:
            db.get(User, 'owner').google_id = 'google-owner'
            db.commit()
        user, tokens = asyncio.run(AuthService(db).google_oauth_login('stub'))
        assert user.name == 'Chosen Name'
        assert user.avatar_url == 'https://example.test/avatar.png'
        assert tokens.access_token


@pytest.mark.parametrize('linked', [False, True])
def test_google_login_moves_google_photo_to_local_storage(profile_api, monkeypatch, tmp_path, linked):
    import asyncio
    from unittest.mock import AsyncMock
    from app.auth.service import AuthService
    client, sessions = profile_api
    google_url = 'https://lh3.googleusercontent.com/a/test-picture'
    local_url = 'http://localhost:8000/api/auth/avatars/' + 'a' * 32 + '.webp'
    saved_file = tmp_path / 'cached.webp'
    saved_file.write_bytes(b'image')
    cache = AsyncMock(return_value=(saved_file, local_url))
    monkeypatch.setattr('app.auth.service.cache_google_avatar', cache)
    monkeypatch.setattr(SecurityUtils, 'exchange_google_code', AsyncMock(return_value={'access_token': 'stub'}))
    monkeypatch.setattr(SecurityUtils, 'get_google_user_info', AsyncMock(return_value={
        'id': 'google-cached', 'email': 'other@example.test', 'name': 'Google Name', 'picture': google_url,
    }))
    with sessions() as db:
        user = db.get(User, 'other')
        user.avatar_url = google_url
        if linked:
            user.google_id = 'google-cached'
        db.commit()
        logged_in, _ = asyncio.run(AuthService(db).google_oauth_login('stub'))
        assert logged_in.avatar_url == local_url
        assert logged_in.google_id == 'google-cached'
        assert db.get(User, 'other').avatar_url == local_url
    cache.assert_awaited_once_with(google_url)


def test_google_avatar_source_is_restricted():
    from app.auth.avatars import is_google_avatar_url
    assert is_google_avatar_url('https://lh3.googleusercontent.com/a/picture')
    assert not is_google_avatar_url('http://lh3.googleusercontent.com/a/picture')
    assert not is_google_avatar_url('https://lh3.googleusercontent.com.evil.test/a/picture')
    assert not is_google_avatar_url('https://evil.test/a/picture')


def test_google_photo_is_validated_and_saved(avatar_store, monkeypatch):
    import asyncio
    import httpx
    from app.auth.avatars import cache_google_avatar
    url = 'https://lh3.googleusercontent.com/a/picture'
    original_client = httpx.AsyncClient
    transport = httpx.MockTransport(lambda request: httpx.Response(200, headers={'content-type': 'image/png'}, content=image_bytes()))
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original_client(transport=transport, **kwargs))
    result = asyncio.run(cache_google_avatar(url))
    assert result is not None
    path, public_url = result
    assert path.is_file()
    assert path.parent == avatar_store
    assert public_url.startswith('https://api.example.test/api/auth/avatars/')


def test_google_photo_rejects_oversized_response(avatar_store, monkeypatch):
    import asyncio
    import httpx
    from app.auth.avatars import cache_google_avatar, MAX_AVATAR_BYTES
    original_client = httpx.AsyncClient
    transport = httpx.MockTransport(lambda request: httpx.Response(200, headers={'content-type': 'image/png'}, content=b'x' * (MAX_AVATAR_BYTES + 1)))
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original_client(transport=transport, **kwargs))
    assert asyncio.run(cache_google_avatar('https://lh3.googleusercontent.com/a/picture')) is None
    assert not avatar_store.exists()


def test_excessive_pixel_dimensions_are_rejected(profile_api, avatar_store):
    import struct
    import zlib
    content = bytearray(image_bytes())
    content[16:24] = struct.pack('>II', 5000, 5000)
    content[29:33] = struct.pack('>I', zlib.crc32(content[12:29]))
    client, _ = profile_api
    assert client.post('/api/auth/me/avatar', files={'avatar': ('huge.png', bytes(content), 'image/png')}).status_code == 422
    assert not avatar_store.exists()


def test_new_google_user_has_no_role_until_onboarding(profile_api, monkeypatch):
    import asyncio
    from unittest.mock import AsyncMock
    from app.auth.service import AuthService
    _, sessions = profile_api
    monkeypatch.setattr('app.auth.service.cache_google_avatar', AsyncMock(return_value=None))
    monkeypatch.setattr(SecurityUtils, 'exchange_google_code', AsyncMock(return_value={'access_token': 'stub'}))
    monkeypatch.setattr(SecurityUtils, 'get_google_user_info', AsyncMock(return_value={
        'id': 'google-brand-new', 'email': 'brand.new@example.test', 'name': 'Brand New', 'picture': None,
    }))
    with sessions() as db:
        user, _ = asyncio.run(AuthService(db).google_oauth_login('stub'))
        assert user.user_type is None  # frontend redirects to /userType when this is empty
        assert AuthService(db).get_login_response_data(user).user_type is None
