import React from 'react';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
      <div>
          app-layout
          <Outlet />
      </div>
  )
}

export default AppLayout