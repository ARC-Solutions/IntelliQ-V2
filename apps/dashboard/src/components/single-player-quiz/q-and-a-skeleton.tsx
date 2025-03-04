import { Skeleton } from "../ui/skeleton";
import { motion } from "framer-motion";

function QAndASkeleton() {
  return (
    <section>
      {/* Question Title Skeleton */}
      <motion.h1
        className="w-full items-center rounded-md bg-primary p-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-2">
          <Skeleton className="mx-auto h-8 w-3/4" />
          <Skeleton className="mx-auto h-8 w-1/2" />
        </div>
      </motion.h1>

      <div className="mt-4 w-auto">
        {/* Your Answer skeleton */}
        <motion.div
          className="mt-8 w-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Skeleton className="flex h-[56px] w-full items-center justify-start rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-[100px] p-4" />
              <Skeleton className="h-4 w-[120px] p-4" />
            </div>
          </Skeleton>
        </motion.div>

        {/* Correct Answer skeleton */}
        <motion.div
          className="mt-8 w-full mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Skeleton className="flex h-[56px] w-full items-center justify-start rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-[120px] p-4" />
              <Skeleton className="h-4 w-[120px] p-4" />
            </div>
          </Skeleton>
        </motion.div>
      </div>
    </section>
  );
}

export default QAndASkeleton;
