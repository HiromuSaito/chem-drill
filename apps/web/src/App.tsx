import { trpc } from "./trpc";

export function App() {
  const health = trpc.health.useQuery(undefined, { enabled: false });

  return (
    <div>
      <h1>Chem Drill</h1>
      <button onClick={() => health.refetch()}>Health Check</button>
      {health.isFetching && <p>checking...</p>}
      {health.data && <pre>{health.data.status}</pre>}
      {health.error && <pre>Error: {health.error.message}</pre>}
    </div>
  );
}
