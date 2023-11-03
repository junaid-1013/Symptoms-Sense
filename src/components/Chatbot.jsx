'use client'
import React, { useEffect } from 'react'

const Chatbot = () => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.botpress.cloud/webchat/v1/inject.js'
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      window.botpressWebChat.init({
        "composerPlaceholder": "Chat with bot",
        "botConversationDescription": "This chatbot was built surprisingly fast with Botpress",
        "botId": "f4cdf2af-02e9-4850-9693-866d07c10102",
        "hostUrl": "https://cdn.botpress.cloud/webchat/v1",
        "messagingUrl": "https://messaging.botpress.cloud",
        "clientId": "f4cdf2af-02e9-4850-9693-866d07c10102",
        "webhookId": "127b823e-4a15-4280-b972-eb0943c1305a",
        "lazySocket": true,
        "themeName": "prism",
        "frontendVersion": "v1",
        "theme": "prism",
        "themeColor": "#2563eb",
      });
    }
  }, [])

  return <div id="webchat" className='z-20' />
}

export default Chatbot