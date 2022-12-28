const queue: any[] = []
let isFlushPending = false
const promise = Promise.resolve()

export function nextTick(fn) {
  return fn ? promise.then(fn) : promise
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  queueFlush()
}

function queueFlush() {
  if (isFlushPending) {
    return
  }
  isFlushPending = true
  nextTick(flushJobs)
}

function flushJobs() {
  let job
  isFlushPending = false
  while (job = queue.shift()) {
    job && job()
  }
}