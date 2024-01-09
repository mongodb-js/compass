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
	"bytes"
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

	if _, err := os.Stat(fileToSignPath); os.IsNotExist(err) {
		log.Fatalf("File %s does not exist", fileToSignPath)
	}

	allowedExtensions := []string{
		"WINDOWS_SIGNING_SERVER_HOSTNAME",
		"WINDOWS_SIGNING_SERVER_PRIVATE_KEY",
		"WINDOWS_SIGNING_SERVER_USERNAME",
		"WINDOWS_SIGNING_SERVER_PORT",
	}
	for _, k := range allowedExtensions {
		if os.Getenv(k) == "" {
			log.Fatal(fmt.Sprintf("Must set %s environment variable", k))
		}
	}

	script := fmt.Sprintf(`
		require("@mongodb-js/signing-utils").sign("%s", {
			client: "remote",
			signingMethod: "jsign",
			host: process.env.WINDOWS_SIGNING_SERVER_HOSTNAME,
			username: process.env.WINDOWS_SIGNING_SERVER_USERNAME,
			port: process.env.WINDOWS_SIGNING_SERVER_PORT,
			privateKey: process.env.WINDOWS_SIGNING_SERVER_PRIVATE_KEY,
	  	});
	`, fileToSignPath)

	cmd := exec.Command("node", "-e", script)
	fmt.Println("Running command:", cmd.String())

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	if err != nil {
		fmt.Println("Error signing the file:", err)
		fmt.Println("Stderr:", stderr.String())
		return
	}
	fmt.Println("File signed successfully.")
}
