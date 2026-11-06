import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import './image-viewer.css';

export function openImageViewer(opener, onClose) {
  const buttons = opener.hasAttribute('data-photo-preview')
    ? [...document.querySelectorAll('[data-photo-preview]')]
    : [opener];
  const dataSource = buttons.map(button => {
    const image = button.querySelector('img');
    return {
      src: button.dataset.preview,
      width: Number(image.getAttribute('width')),
      height: Number(image.getAttribute('height')),
      alt: button.dataset.previewAlt,
      title: button.dataset.previewTitle,
      msrc: image.currentSrc || image.src,
      element: button,
    };
  });
  const viewer = new PhotoSwipe({
    dataSource,
    index: buttons.indexOf(opener),
    bgOpacity: .97,
    mainClass: 'portfolio-viewer',
    padding: { top: 76, bottom: 76, left: 20, right: 20 },
    wheelToZoom: true,
    returnFocus: false,
    showHideAnimationType: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'zoom',
    errorMsg: 'This image could not be loaded. Close the viewer and try again.',
  });
  viewer.on('uiRegister', () => {
    viewer.ui.registerElement({
      name: 'caption',
      order: 9,
      appendTo: 'root',
      onInit(element) {
        element.setAttribute('aria-live', 'polite');
        viewer.on('change', () => { element.textContent = dataSource[viewer.currIndex].title; });
      },
    });
  });
  viewer.on('destroy', onClose);
  viewer.init();
}
