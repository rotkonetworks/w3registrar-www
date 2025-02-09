import React, { useEffect, useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import { Faq, HowItWorks, VerificationStatesOverview, WhatYouGet } from '~/help';

interface CarouselWrapperProps {
  autoPlayInterval?: number;
  currentSlideIndex?: number;
  onSlideIndexChange?: (index: number) => void;
}

export const HelpCarousel: React.FC<CarouselWrapperProps> = ({ 
  autoPlayInterval = 0, 
  currentSlideIndex = 0, 
  onSlideIndexChange = () => {}
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
      className="max-w-[29rem]" 
      showArrows={false} 
      showThumbs={false} 
      showStatus={false}
      infiniteLoop={true}
      autoPlay={autoPlayInterval > 0}
      interval={autoPlayInterval}
      selectedItem={currentSlide}
      onChange={handleChange}
    >
      <div className="max-w-[27rem]">
        <WhatYouGet />
      </div>
      <div className="max-w-[27rem]">
        <HowItWorks />
      </div>
      <div className="max-w-[27rem]">
        <Faq />
      </div>
      <div className="max-w-[27rem]">
        <VerificationStatesOverview />
      </div>
    </Carousel>
  );
};
