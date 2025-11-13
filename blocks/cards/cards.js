/*
import { patternDecorate } from '../../scripts/blockTemplate.js';

export default async function decorate(block) {
  patternDecorate(block);
}
*/

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
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
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
 
  block.textContent = '';
  block.append(ul);

  const blocks = document.querySelectorAll(`.cards`);
  blocks.forEach((block, index) => {
    block.id = `cards-${index}`;
    
    // Add indexed IDs to images within the block
    const images = block.querySelectorAll('img');
    images.forEach((img, imgIndex) => {
      const imgId = `cards_${index}_image_${imgIndex}`;
      img.id = imgId;
    });

    // Add indexed IDs to text content divs only
    const cardBodies = block.querySelectorAll('.cards-card-body');
    cardBodies.forEach((cardBody, bodyIndex) => {
      cardBody.setAttribute('data-text-block-index', bodyIndex);
    });

    // Add indexed IDs to heading elements with container context
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6','p'].forEach((tag) => {
      const elements = block.querySelectorAll(tag);
      elements.forEach((el) => {
        const textBlock = el.closest('[data-text-block-index]');
        const textBlockIndex = textBlock ? textBlock.getAttribute('data-text-block-index') : 'unknown';
        
        // Count this tag within its text block
        const textBlockElements = textBlock ? textBlock.querySelectorAll(tag) : [el];
        const tagIndex = Array.from(textBlockElements).indexOf(el);
        
        el.id = `cards_${index}_text_${textBlockIndex}_${tag}_${tagIndex}`;
      });
    });
  });
}
