import { StepType, useTour } from "@reactour/tour"
import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useLocalStorage } from "./useLocalStorage"

type TourCollection = {
  [key: string]: StepType[]
}
type tourStatus = {
  completed: boolean
  lastStep?: number
}
type TourStatuses = {
  [key: string]: tourStatus
}

export const useTourManager = (tourCollection: TourCollection) => {
  const [tourStatuses, setTourStatuses] = useLocalStorage<TourStatuses>("displayedTours", {})
  const {
    isOpen: isTourOpen,
    setIsOpen: setTourOpen,
    currentStep: tourStep,
    setCurrentStep: setTourStep,
    steps: tourSteps,
    setSteps: setTourSteps,
  } = useTour()

  useEffect(() => {
    console.log({ tourCollection, tourStatuses })
    setCurrentTour(tourCollection[Object.keys(tourCollection)[0]]
      ? Object.keys(tourCollection)[0]
      : null
    )
  }, [tourCollection])

  const [currentTour, setCurrentTour] = useState<keyof TourCollection>()
  const openTour = useCallback((tour: keyof TourCollection) => {
    setCurrentTour(tour)
    setTourSteps(tourCollection[tour])
    setTourOpen(true)
    setTourStep(0)
  }, [tourCollection])
  const closeTour = useCallback(() => {
    setTourOpen(false)
    setCurrentTour(null)
  }, [currentTour, tourStatuses, tourCollection])

  const tryOpenTourIfNotShown = useCallback((tour: keyof TourCollection) => {
    if (tour === currentTour && isTourOpen) {
      return
    }
    if (tourStatuses[tour]?.completed) {
      return
    }
    openTour(tour)
  }, [currentTour, tourStatuses, openTour])

  const [pendingTours, setPendingTours] = useState<string[]>(
    Object.keys(tourCollection).filter(tour => !tourStatuses[tour]?.completed)
  )
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (timeoutRef.current && isTourOpen) {
        return
      }
      console.log({ tourCollection, tourStatuses, currentTour, tourStep, pendingTours })
      if (tourCollection[currentTour]?.length -1 === tourStep) {
        setTourStatuses((prevStatuses) => ({
          ...prevStatuses,
          [currentTour]: {
            completed: true,
          },
        }))
      }
      const pendingTour = pendingTours[0];
      if (pendingTour) {
        tryOpenTourIfNotShown(pendingTour)
        setPendingTours((prevTours) => prevTours
          .filter((tour, index) => 
            index !== Object.keys(tourCollection).indexOf(pendingTour) 
              && !tourStatuses[tour]?.completed
              && currentTour !== tour
          ) || []
        )
      } else if (pendingTours.length === 0) {
        setCurrentTour(null)
      }
      timeoutRef.current = null
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [tourCollection, tourStatuses, currentTour, tourStep, pendingTours])

  return {
    isTourOpen,
    setTourOpen,
    tourStep,
    setTourStep,
    tourSteps,
    setTourSteps,
    openTour,
    closeTour,
    tryOpenTourIfNotShown,
  }
}
