import { auth } from "@/lib/auth";
import { headers } from "next/headers";


export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <div className="flex flex-1 flex-col p-6">
      <div>
        <span className="font-display text-9xl">
          Hello {session?.user.name}!
        </span>
      </div>

      <main className="grid h-112 grid-cols-5 grid-rows-3 gap-3">
        <div className="flex items-center                          justify-center rounded-lg bg-rose-500 text-lg font-semibold text-white">
          1
        </div>
        <div className="flex items-center                          justify-center rounded-lg bg-orange-500 text-lg font-semibold text-white">
          2
        </div>
        <div className="flex items-center                          justify-center rounded-lg bg-amber-500 text-lg font-semibold text-white">
          3
        </div>
        <div className="flex items-center                          justify-center rounded-lg bg-lime-500 text-lg font-semibold text-white">
          4
        </div>
        <div className="flex items-center                          justify-center rounded-lg bg-teal-500 text-lg font-semibold text-white">
          5
        </div>
        <div className="col-span-3 row-span-2 flex items-center    justify-center rounded-lg bg-blue-600 text-lg font-semibold text-white">
          6
        </div>
        <div className="col-span-2 row-span-2 flex items-center    justify-center rounded-lg bg-violet-600 text-lg font-semibold text-white">
          7
        </div>
      </main>
    </div>
  );
}
