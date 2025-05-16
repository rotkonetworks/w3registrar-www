import { Profiler as ReactProfiler } from 'react';

function onRenderCallback(
  id: string, // the “id” prop of the Profiler tree that just committed
  phase: "mount" | "update", // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
  actualDuration: number, // time spent rendering the committed update
  baseDuration: number, // estimated time to render the entire subtree without memoization
  startTime: number, // when React began rendering this update
  commitTime: number, // when React committed this update
) {
  console.log(
    `%c[Profiler:${id}] %c${phase}`,
    'color: purple; font-weight: bold',
    'color: gray',
    { actualDuration, baseDuration }
  );
}

export function Profiler({ id, children }: { id: string, children: React.ReactNode }) {
  return (
    <ReactProfiler id="AppTree" onRender={onRenderCallback}>
      {children}
    </ReactProfiler>
  );
}
