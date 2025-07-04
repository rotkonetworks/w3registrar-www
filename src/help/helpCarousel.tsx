import React, { useEffect, useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import { twMerge } from 'tailwind-merge';

import { HELP_SLIDES, Collection, } from '~/help';

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  autoPlayInterval?: number;
  currentSlideIndex?: number;
  onSlideIndexChange?: (index: number) => void;
}

export const HelpCarousel: React.FC<CarouselProps> = ({ 
  autoPlayInterval = 0, 
  currentSlideIndex = 0, 
  onSlideIndexChange = () => {},
  ...rest
}) => {
  const [currentSlide, setCurrentSlide] = useState(currentSlideIndex);

  useEffect(() => {
    setCurrentSlide(currentSlideIndex);
  }, [currentSlideIndex]);

  const handleChange = (index: number) => {
    setCurrentSlide(index);
    onSlideIndexChange(index);
  };

  return (
    <div className="flex flex-col items-center font-sans">
      <Carousel 
        className={twMerge("sm:w-[29rem] w-[74vw]", rest.className)} 
        showArrows={false} 
        showThumbs={false} 
        showStatus={false}
        infiniteLoop={true}
        autoPlay={autoPlayInterval > 0}
        interval={autoPlayInterval}
        selectedItem={currentSlide}
        onChange={handleChange}
        renderIndicator={(_clickHandler, isSelected, index, _label) => {
          const title = HELP_SLIDES[Object.keys(HELP_SLIDES)[index]].title;
          return (
            <li
              className={twMerge('text-sm inline-block p-1', 
                isSelected ? 'text-primary font-bold' : 'bg-transparent'
              )}
              onClick={setCurrentSlide.bind(null, index)}
              onKeyDown={setCurrentSlide.bind(null, index)}
              value={index}
              key={index}
              role="button"
              tabIndex={0}
              title={title}
              aria-label={title}
            >
              {title}
            </li>
          );
        }}
      >
        {Object.entries(HELP_SLIDES).map(([key, { title, items }]) => (
          <div key={key} className="sm:pb-[3rem] pb-[4rem] flex-center flex-col">
            <Collection title={title} items={[...items]} />
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export const SLIDES_COUNT = Object.keys(HELP_SLIDES).length;
