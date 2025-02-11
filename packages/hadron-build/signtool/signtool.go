// signtool.exe emulator
//
// This tool emulates the signtool.exe tool from Microsoft for signing windows
// binaries: https://msdn.microsoft.com/en-us/library/windows/desktop/aa387764(v=vs.85).aspx
//
// It only uses the last argument on the command-line, which is the path to the file to sign.
// If signing is successful, it will replace the file with the newly-signed file from garasign.
package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
)

func main() {
	if len(os.Args) == 1 {
		log.Fatal("Must have at least one argument (the file to sign) on the command line")
	}

	fileToSignPath := os.Args[len(os.Args)-1]

	if _, err := os.Stat(fileToSignPath); os.IsNotExist(err) {
		log.Fatalf("File %s does not exist", fileToSignPath)
	}

	allowedExtensions := []string{
		"GARASIGN_USERNAME",
		"GARASIGN_PASSWORD",
		"ARTIFACTORY_USERNAME",
		"ARTIFACTORY_PASSWORD",
		"SIGNING_SERVER_HOSTNAME",
		"SIGNING_SERVER_PRIVATE_KEY",
		"SIGNING_SERVER_USERNAME",
		"SIGNING_SERVER_PORT",
	}
	for _, k := range allowedExtensions {
		if os.Getenv(k) == "" {
			log.Fatal(fmt.Sprintf("Must set %s environment variable", k))
		}
	}

	// Normalize windows path
	fileToSignPath = fmt.Sprintf(strings.Replace(fileToSignPath, "\\", "\\\\", -1))

	script := fmt.Sprintf(`
		require("@mongodb-js/signing-utils").sign("%s", {
			host: process.env.SIGNING_SERVER_HOSTNAME,
			username: process.env.SIGNING_SERVER_USERNAME,
			port: process.env.SIGNING_SERVER_PORT,
			privateKey: process.env.SIGNING_SERVER_PRIVATE_KEY,
			client: "remote",
			signingMethod: "jsign",
	  	});
	`, fileToSignPath)

	cmd := exec.Command("node", "-e", script)
	fmt.Println("Running command:", cmd.String())

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		fmt.Println("Error signing the file")
		return
	}

	fmt.Println("File signed successfully.")
}
