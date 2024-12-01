class DesktopTheme {
    static getTitleBarStyle(isWindowFocused, windowType) {
      return {
        backgroundColor: isWindowFocused ? '#fff' : '#333',
        color: isWindowFocused ? '#000' : '#fff',
        padding: '5px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'move',
      };
    }
  }
  
  export default DesktopTheme;
  