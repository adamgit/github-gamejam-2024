import React from 'react';
import background from '../../public/assets/background.jpg';

const DesktopBackground = ({onClickBackground}) => {
  return (
    <div className="desktop-background"
    onClick={onClickBackground}
    style={{
      pointerEvents: 'auto',
       backgroundImage: `url(${background})`,
        width: '100vw',
         height: '100vh',
          backgroundSize: 'cover' }}>
    </div>
  );
};

export default DesktopBackground;
