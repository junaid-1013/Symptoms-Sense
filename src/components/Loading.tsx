import React from 'react';

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="mb-4">
        <div className="border-t-4 border-blue-500 border-solid rounded-full animate-spin w-12 h-12"></div>
      </div>
      <br></br>
      <p className="text-blue-500 text-lg font-semibold">Loading...</p>
    </div>
  );
};

export default Loading;