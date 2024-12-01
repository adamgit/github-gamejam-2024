import React from 'react';

const Layer = ({ zIndex, children }) => {
  const layerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: zIndex,
    overflow: 'hidden',  // Prevents overflow in case child content goes beyond window size
    pointerEvents: 'none', /* Allow clicks to pass through this layer */
  };

  return <div style={layerStyle}>{children}</div>;
};

export default Layer;
