/*
all this does it the shell one-liner:

$BINARY "$@" $POSITONAL_ARGS

Why? Because we have to get chromedriver to open chrome (actually electron) like
that and shell scripts don't just work on windows.

Why not just pass POSITIONAL_ARGS directly? Because something in the webdriverio
-> webdriver -> chromedriver -> chrome (electron) chain is automatically
prepending -- to all args that don't already have it and compass supports
optional positional args that we're trying to write e2e tests for.
*/

package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
)

func main() {
	binary := os.Getenv("BINARY")
	positionalArgs := os.Getenv("POSITIONAL_ARGS")
	args := os.Args[1:]

	commandArgs := append(args, positionalArgs)
	cmd := exec.Command(binary, commandArgs...)
	fmt.Println("Running command:", cmd.String())

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Successfully ran ", cmd.String())
}
