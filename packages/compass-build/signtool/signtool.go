// signtool.exe emulator
//
// This tool emulates the signtool.exe tool from Microsoft for signing windows
// binaries: https://msdn.microsoft.com/en-us/library/windows/desktop/aa387764(v=vs.85).aspx
//
// It only uses the last argument on the command-line, which is the path to the file to sign.
// If signing is successful, it will replace the file with the newly-signed file from the
// notary service.
//
// Parameters for the notary service are passed in as environment variables.
// NOTARY_SIGNING_KEY - The name of the key to use for signing
// NOTARY_SIGNING_COMMENT - The comment to enter into the notary log for this signing operation
// NOTARY_AUTH_TOKEN - The password for using the selected signing key
// NOTARY_URL - The URL of the notary service
//

package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/crypto/pbkdf2"
)

func generateAuthToken(authTokenPassword string) string {
	// In one of my more foolish moments, the salt is just the password in reverse.
	// We should fix this, but for compatibility this is here for now.
	var salt []byte = []byte(authTokenPassword)
	for i := len(salt)/2 - 1; i >= 0; i-- {
		opp := len(salt) - 1 - i
		salt[i], salt[opp] = salt[opp], salt[i]
	}

	authKey := pbkdf2.Key([]byte(authTokenPassword), salt, 1000, 16, sha1.New)
	dateStr := time.Now().String()
	signedData := hmac.New(sha1.New, authKey)
	signedData.Write([]byte(dateStr))
	rawSignature := signedData.Sum(nil)
	return fmt.Sprintf("%x%s", rawSignature, dateStr)
}

func submitFileForSigning(fileToSignPath string) string {
	localFile, err := os.Open(fileToSignPath)
	if err != nil {
		log.Fatal(err)
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	fileToSignName := filepath.Base(fileToSignPath)

	// The notary service does not support filenames with spaces, so we
	// strip those in the form data
	formFileName := strings.ReplaceAll(fileToSignName, " ", "")

	part, err := writer.CreateFormFile("file", formFileName)
	if err != nil {
		log.Fatal(err)
	}

	_, err = io.Copy(part, localFile)
	localFile.Close()
	signingKey := os.Getenv("NOTARY_SIGNING_KEY")
	writer.WriteField("key", signingKey)
	writer.WriteField("comment", os.Getenv("NOTARY_SIGNING_COMMENT"))
	writer.WriteField("auth_token", generateAuthToken(os.Getenv("NOTARY_AUTH_TOKEN")))
	err = writer.Close()
	if err != nil {
		log.Fatal(err)
	}

	signingURL := fmt.Sprintf("%s/api/sign", os.Getenv("NOTARY_URL"))
	req, err := http.NewRequest("POST", signingURL, body)
	if err != nil {
		log.Fatal(err)
	}
	req.Header.Add("Content-Type", writer.FormDataContentType())

	log.Printf("Sending sign request for '%s' to '%s' with key '%s'", fileToSignName, signingURL, signingKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}

	respBody, err := ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		log.Fatal(err)
	}

	if resp.StatusCode >= 400 {
		log.Fatalf("Signing failed: %s - %s", resp.Status, string(respBody))
	}

	var signingResponse map[string]interface{}
	err = json.Unmarshal(respBody, &signingResponse)
	if err != nil {
		log.Fatal(err)
	}

	if _, ok := signingResponse["permalink"]; !ok {
		log.Fatal("Signing service didn't return a permalink")
	}

	log.Printf("Signed artifact ready at %s", signingResponse["permalink"].(string))

	return signingResponse["permalink"].(string)
}

func downloadArtifact(permaLink, localPath string) {
	tempFile, err := ioutil.TempFile("", "signtool-download-")
	if err != nil {
		log.Fatal(err)
	}

	defer tempFile.Close()
	defer os.Remove(tempFile.Name())

	if !strings.HasPrefix(permaLink, "/") {
		permaLink = "/" + permaLink
	}

	downloadURL := fmt.Sprintf("%s%s", os.Getenv("NOTARY_URL"), permaLink)

	log.Printf("Downloading signed file from '%s' to '%s'", downloadURL, tempFile.Name())

	resp, err := http.Get(downloadURL)
	if err != nil {
		log.Fatal(err)
	}

	if resp.StatusCode >= 400 {
		log.Fatalf("Download failed: %s", resp.Status)
	}

	defer resp.Body.Close()
	_, err = io.Copy(tempFile, resp.Body)
	if err != nil {
		log.Fatal(err)
	}

	localFile, err := os.Create(localPath)
	if err != nil {
		log.Fatal(err)
	}
	defer localFile.Close()

	log.Printf("Copying signed file back from '%s' to '%s'", tempFile.Name(), localFile.Name())

	tempFile.Seek(0, 0)
	io.Copy(localFile, tempFile)

	log.Printf("Done.")
}

func main() {
	if len(os.Args) == 1 {
		log.Fatal("Must have at least one argument (the file to sign) on the command line")
	}

	allowedExtensions := []string{
		"NOTARY_SIGNING_KEY",
		"NOTARY_SIGNING_COMMENT",
		"NOTARY_AUTH_TOKEN",
		"NOTARY_URL",
	}
	for _, k := range allowedExtensions {
		if os.Getenv(k) == "" {
			log.Fatal(fmt.Sprintf("Must set %s environment variable", k))
		}
	}

	// The last argument is always the path of the file to sign
	fileToSignPath := os.Args[len(os.Args)-1]

	if !strings.HasSuffix(fileToSignPath, ".exe") &&
		!strings.HasSuffix(fileToSignPath, ".msi") &&
		!strings.HasSuffix(fileToSignPath, ".rpm") {

		fmt.Printf("Skipping %s signature, extension is not supported", fileToSignPath)
		return
	}

	permaLink := submitFileForSigning(fileToSignPath)
	downloadArtifact(permaLink, fileToSignPath)
}
