import React, { useEffect, useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import { HELP_SLIDES, Collection, } from '~/help';

interface CarouselProps {
  autoPlayInterval?: number;
  currentSlideIndex?: number;
  onSlideIndexChange?: (index: number) => void;
  [rest: string]: any;
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
    <Carousel 
      className={"max-w-[29rem] " + rest.className} 
      showArrows={false} 
      showThumbs={false} 
      showStatus={false}
      infiniteLoop={true}
      autoPlay={autoPlayInterval > 0}
      interval={autoPlayInterval}
      selectedItem={currentSlide}
      onChange={handleChange}
    >
      {Object.entries(HELP_SLIDES).map(([key, { title, items }]) => (
        <div key={key} className="max-w-[27rem] pb-[2rem]">
          <Collection title={title} items={items} />
        </div>
      ))}
    </Carousel>
  );
};

export const SLIDES_COUNT = Object.keys(HELP_SLIDES).length;
