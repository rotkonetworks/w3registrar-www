import { StepType, useTour } from "@reactour/tour"
import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useLocalStorage } from "./useLocalStorage"
import { waitForElement } from "~/utils/waitForSelector"

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

export const useTourManager = (_tourCollection?: TourCollection) => {
  const [tourCollection, setTourCollection] = useState<TourCollection | undefined>(_tourCollection)
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
    console.log({ tourCollection })
    setCurrentTour(tourCollection?.[Object.keys(tourCollection)[0]]
      ? Object.keys(tourCollection)[0]
      : null
    )
  }, [tourCollection])

  const waitingForTour = useRef(false)
  const [currentTour, setCurrentTour] = useState<keyof TourCollection>()
  const openTour = useCallback(async (tour: keyof TourCollection) => {
    if (waitingForTour.current) {
      throw new Error("Tour is already waiting for an element to be shown")
    }
    waitingForTour.current = true
    await waitForElement(tourCollection[tour][0].selector as string, {
      root: document.querySelector("#root"),
    })
    waitingForTour.current = false
    setCurrentTour(tour)
    setTourSteps(tourCollection[tour])
    setTourOpen(true)
    setTourStep(0)
  }, [tourCollection])
  const closeTour = useCallback(() => {
    setTourOpen(false)
    setCurrentTour(null)
  }, [])

  const tryOpenTourIfNotShown = useCallback(async (tour: keyof TourCollection) => {
    if (tour === currentTour && isTourOpen) {
      return
    }
    if (tourStatuses[tour]?.completed) {
      return
    }
    await openTour(tour)
  }, [currentTour, tourStatuses, openTour])

  const [pendingTours, setPendingTours] = useState<string[]>(
    tourCollection ? Object.keys(tourCollection).filter(tour => !tourStatuses[tour]?.completed) : []
  )
  useEffect(() => setPendingTours(tourCollection
    ? Object.keys(tourCollection).filter(tour => !tourStatuses[tour]?.completed)
    : []
  ), [tourCollection, tourStatuses])

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    timeoutRef.current = setTimeout(async () => {
      console.log({ tourCollection, tourStatuses, currentTour, tourStep, pendingTours, isTourOpen })
      const lastStepReached = tourCollection[currentTour]?.length - 1 === tourStep
      setTourStatuses((prevStatuses) => ({
        ...prevStatuses,
        [currentTour]: {
          completed: prevStatuses[currentTour]?.completed || lastStepReached,
        },
      }))
      if (timeoutRef.current && isTourOpen) {
        return
      }
      const pendingTour = pendingTours[0];
      if (pendingTour) {
        try {
          await tryOpenTourIfNotShown(pendingTour)
        } catch (error) {
          console.error("Error opening tour:", error)
          return
        }
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
  }, [tourCollection, tourStatuses, currentTour, tourStep, pendingTours, isTourOpen])

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

    currentTour,
    setCurrentTour,
    tourStatuses,
    pendingTours,
    tourCollection,
    setTourCollection,
  }
}
