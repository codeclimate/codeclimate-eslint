#!/bin/bash

echo "▶ Running system tests..."

if [[ "$(docker images -q codeclimate/codeclimate-eslint 2> /dev/null)" == "" ]]; then
    echo "▶ Building image..."
    make image
fi

SOURCE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

for d in system-tests/*/ ; do
    echo ""
    echo "▶ Running  $d ..."
    echo "${SOURCE}"/"${d}" 
    cd "${SOURCE}"/"${d}" || exit
    output=$(docker run \
      --interactive --tty --rm \
      --env CODECLIMATE_CODE="$PWD" \
      --volume "$PWD":/code \
      --volume /var/run/docker.sock:/var/run/docker.sock \
      --volume /tmp/cc:/tmp/cc \
      codeclimate/codeclimate analyze --dev)

    if [[ -f "${SOURCE}/${d}snapshot" ]]; then
      count=$(cat "${SOURCE}"/"${d}"snapshot)
      issues=$(echo ${output} | sed -E "s/.*Found ([0-9]+).*/\1/")

      if [[ "$issues" -ne "$count" ]]; then
        echo -e "FAIL It should have $count issues but found $issues";
        exit 1
      else
        echo -e "PASS Found $issues issues"
      fi
    fi

    if [[ -f "${SOURCE}/${d}error" ]]; then
      expected_error=$(cat "${SOURCE}"/"${d}"error)

      if [[ "$output" == *"$expected_error"* ]]; then
        echo -e "PASS Expected error found"
      else
        echo -e "FAIL It should have errored with: $expected_error";
        exit 1
      fi
    fi

    if [[ "$?" -ne 0 ]]; then
      break
    fi
done
