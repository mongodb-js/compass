# Retries a command a with backoff.
#
# The retry count is given by ATTEMPTS (default 5), the
# initial backoff timeout is given by TIMEOUT in seconds
# (default 1.)
#
# Successive backoffs double the timeout.
#
#
# Note: set -e would kill the entire script before retrying
#
function retry_with_backoff {
  local max_attempts=${ATTEMPTS-5}
  local timeout=${TIMEOUT-1}
  local attempt=0
  local exitCode=0

  while [[ $attempt < $max_attempts ]]
  do
    attempt_prompt=$(( attempt + 1 ))
    echo "retry_with_backoff: running '${@}' - attempt n. ${attempt_prompt} ..."

    "$@"
    exitCode=$?

    if [[ $exitCode == 0 ]]
    then
      break
    fi

    echo "retry_with_backoff: attempt failed! Retrying in ${timeout}.." 1>&2
    sleep "${timeout}"
    attempt=$(( attempt + 1 ))
    timeout=$(( timeout * 2 ))
  done

  if [[ $exitCode != 0 ]]
  then
    echo "retry_with_backoff: All attempts failed" 1>&2
  fi

  return $exitCode
}

retry_with_backoff $@
