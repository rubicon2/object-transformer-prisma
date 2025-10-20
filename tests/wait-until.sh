#!/usr/bin/env bash

command="${1}"
max_time="${2:-60}"

i=1

until eval "${command}"
do
  ((i++))
  if [[ "${i}" -gt "${max_time}" ]]; then
    echo "Aborting after ${max_time} attempts, command did not complete"
    exit 1
  fi
  sleep 1
done
