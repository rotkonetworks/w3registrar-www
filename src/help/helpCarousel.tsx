import React, { useEffect, useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import { 
  Features,
  Steps,
  FAQ,
  States,
} from '~/help';

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
      <div className="max-w-[27rem] pb-[2rem]">
        <Features />
      </div>
      <div className="max-w-[27rem] pb-[2rem]">
        <Steps />
      </div>
      <div className="max-w-[27rem] pb-[2rem]">
        <FAQ />
      </div>
      <div className="max-w-[27rem] pb-[2rem]">
        <States />
      </div>
    </Carousel>
  );
};

export const SLIDES_COUNT = 4;
