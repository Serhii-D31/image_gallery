const scrollChecker = () => {
  const configuration = {
    windowHeight: window.innerHeight,
    fullPageHeight: document.documentElement.scrollHeight,
    scrollTop: window.pageYOffset,
  };

  const calcCurrentScrollPosition = () =>
    configuration.fullPageHeight - configuration.scrollTop;

  const checkScreenCoords = () => {
    const { windowHeight, fullPageHeight, scrollTop } = configuration;

    return {
      isBottomHitOnScroll:
        calcCurrentScrollPosition() + scrollTop === fullPageHeight,
      isBottomHitOnInitView: windowHeight === fullPageHeight,
    };
  };

  return checkScreenCoords();
};

export default scrollChecker;
