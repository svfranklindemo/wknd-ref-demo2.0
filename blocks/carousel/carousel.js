import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import createSlider from '../../scripts/slider.js';


function setCarouselItems(number) {
    document.querySelector('.carousel > ul')?.style.setProperty('--items-per-view', number);
}

export default function decorate(block) {
  let i = 0;
  setCarouselItems(2);
  const slider = document.createElement('ul');
  const leftContent = document.createElement('div');
  [...block.children].forEach((row) => {
    if (i > 3) {
      const li = document.createElement('li');
      const style = row.lastElementChild?.querySelector('p')?.textContent;
      //const style = row.querySelector('p[data-aue-label="Style"]')?.textContent;
      if(style){
        li.className = style;
        row.lastElementChild?.remove();
      }

      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
        else div.className = 'cards-card-body';
      });
      slider.append(li);
    } else {
      if (row.firstElementChild.firstElementChild) {
        leftContent.append(row.firstElementChild.firstElementChild);
      }
      if (row.firstElementChild) {
        leftContent.append(row.firstElementChild.firstElementChild || '');
      }
      leftContent.className = 'default-content-wrapper';
    }
    i += 1;
  });

  slider.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.parentNode.parentNode.prepend(leftContent);
  block.append(slider);
  createSlider(block);
}
