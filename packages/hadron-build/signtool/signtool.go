// signtool.exe emulator
//
// This tool emulates the signtool.exe tool from Microsoft for signing windows
// binaries: https://msdn.microsoft.com/en-us/library/windows/desktop/aa387764(v=vs.85).aspx
//
// It only uses the last argument on the command-line, which is the path to the file to sign.
// If signing is successful, it will replace the file with the newly-signed file from garasign.
//

package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
)

func main() {
	if len(os.Args) == 1 {
		log.Fatal("Must have at least one argument (the file to sign) on the command line")
	}

	fileToSignPath := os.Args[len(os.Args)-1]

	command := fmt.Sprintf(
		"npx @mongodb-js/compass-signtool %s --client=remote --host=%s --private-key=%s  --username=%s  --port=%s",
		fileToSignPath,
		os.Getenv("WINDOWS_SIGNING_SERVER_HOSTNAME"),
		os.Getenv("WINDOWS_SIGNING_SERVER_PRIVATE_KEY"),
		os.Getenv("WINDOWS_SIGNING_SERVER_USERNAME"),
		os.Getenv("WINDOWS_SIGNING_SERVER_PORT"),
	)

	fmt.Printf("Running %s \n", command)

	cmd := exec.Command(command)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// Run the command
	err := cmd.Run()
	if err != nil {
		fmt.Println("Error signing the file:", err)
		return
	}

	fmt.Println("File signed successfully.")
}
