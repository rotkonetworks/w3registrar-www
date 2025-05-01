import { StepType, TourProvider, useTour } from "@reactour/tour"
import { useState, useCallback, useEffect, useRef, createContext, useContext, ReactNode } from "react"
import { useLocalStorage } from "./useLocalStorage"
import { waitForElement } from "~/utils/waitForSelector"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "~/components/ui/button"
import { useDarkMode } from "./useDarkMode"

type TourCollection = {
  [key: string]: StepType[]
}

type TourStatus = {
  completed: boolean
  lastStep?: number
}

type TourStatuses = {
  [key: string]: TourStatus
}

interface TourManagerContextType {
  isTourOpen: boolean
  setTourOpen: (open: boolean) => void
  tourStep: number
  setTourStep: (step: number) => void
  tourSteps: StepType[]
  setTourSteps: (steps: StepType[]) => void
  openTour: (tour: string) => Promise<void>
  closeTour: () => void
  tryOpenTourIfNotShown: (tour: string) => Promise<void>
  currentTour: string | null
  setCurrentTour: (tour: string | null) => void
  tourStatuses: TourStatuses
  pendingTours: string[]
  tourCollection: TourCollection | null
  setTourCollection: (collection: TourCollection) => void
}

const TourManagerContext = createContext<TourManagerContextType | undefined>(undefined)

export function useTourManager(tourCollection?: TourCollection) {
  const context = useContext(TourManagerContext)

  if (!context) {
    throw new Error("useTourManager must be used within a TourManagerProvider")
  }

  useEffect(() => {
    if (tourCollection && !context.tourCollection) {
      context.setTourCollection(tourCollection)
    }
  }, [tourCollection, context])

  return context
}

function TourManagerContextProvider({
  children,
  tourContext
}: {
  children: ReactNode
  tourContext: ReturnType<typeof useTour>
}) {
  const { isDark } = useDarkMode()
  const {
    isOpen: isTourOpen,
    setIsOpen: setTourOpen,
    currentStep: tourStep,
    setCurrentStep: setTourStep,
    steps: tourSteps,
    setSteps: setTourSteps,
  } = tourContext

  const [tourCollection, setTourCollection] = useState<TourCollection | null>(null)
  const [tourStatuses, setTourStatuses] = useLocalStorage<TourStatuses>("displayedTours", {})

  useEffect(() => {
    setCurrentTour(tourCollection?.[Object.keys(tourCollection)[0]]
      ? Object.keys(tourCollection)[0]
      : null
    )
  }, [tourCollection])

  const waitingForTour = useRef(false)
  const [currentTour, setCurrentTour] = useState<string | null>(null)
  
  const openTour = useCallback(async (tour: string) => {
    if (waitingForTour.current || !tourCollection || !tourCollection[tour]) {
      throw new Error("Tour is already waiting or tour doesn't exist")
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
  }, [tourCollection, setTourOpen, setTourStep, setTourSteps])
  
  const closeTour = useCallback(() => {
    setTourOpen(false)
    setCurrentTour(null)
  }, [setTourOpen])

  const tryOpenTourIfNotShown = useCallback(async (tour: string) => {
    if (tour === currentTour && isTourOpen) {
      return
    }
    if (tourStatuses[tour]?.completed) {
      return
    }
    await openTour(tour)
  }, [currentTour, tourStatuses, openTour, isTourOpen])

  const [pendingTours, setPendingTours] = useState<string[]>(
    tourCollection ? Object.keys(tourCollection).filter(tour => !tourStatuses[tour]?.completed) : []
  )
  
  useEffect(() => setPendingTours(tourCollection
    ? Object.keys(tourCollection).filter(tour => !tourStatuses[tour]?.completed)
    : []
  ), [tourCollection, tourStatuses])

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (!tourCollection || !currentTour) {
      return
    }
    
    timeoutRef.current = setTimeout(async () => {
      if (!tourCollection || !currentTour) {
        return
      }
      
      const lastStepReached = tourCollection[currentTour]?.length - 1 === tourStep
      
      if (tourCollection[currentTour].length !== undefined) {
        setTourStatuses((prevStatuses) => ({
          ...prevStatuses,
          [currentTour]: {
            completed: prevStatuses[currentTour]?.completed || lastStepReached,
          },
        }))
      }
      
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
  }, [tourCollection, tourStatuses, currentTour, tourStep, pendingTours, isTourOpen, tryOpenTourIfNotShown])

  const value: TourManagerContextType = {
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

  return (
    <TourManagerContext.Provider value={value}>
      {children}
    </TourManagerContext.Provider>
  )
}

const TourManagerInnerProvider = ({ children }: { children: ReactNode }) => {
  const tourContext = useTour()
  
  return (
    <TourManagerContextProvider tourContext={tourContext}>
      {children}
    </TourManagerContextProvider>
  )
}

export const TourManagerProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const { isDark } = useDarkMode()
  
  return (
    <TourProvider 
      steps={[]}
      components={{
        Arrow: ({ inverted, disabled }) => (
          <Button
            variant='primary'
            disabled={disabled}
            className='rounded-full h-10 w-10'
          >
            {inverted ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          </Button>
        ),
      }}
      styles={{
        popover: (style) => ({
          ...style,
          backgroundColor: !isDark
            ? "hsl(0 0% 100%)"
            : "#2C2B2B"
          ,
        }),
        badge: (style) => ({
          ...style,
          backgroundColor: "rgb(230 0 122 / 1)",
        }),
        navigation: (style) => ({
          ...style,
          color: "rgb(230 0 122 / 1)",
        }),
      }}
    >
      <TourManagerInnerProvider>
        {children}
      </TourManagerInnerProvider>
    </TourProvider>
  )
}

