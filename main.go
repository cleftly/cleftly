package main

import (
	"embed"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/wailsapp/mimetype"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/build
var assets embed.FS

type FileLoader struct {
	http.Handler
}

func NewFileLoader() *FileLoader {
	return &FileLoader{}
}

func (h *FileLoader) ServeHTTP(res http.ResponseWriter, req *http.Request) {
	requestedFilename := req.URL.Path

	if !strings.HasPrefix(requestedFilename, "/localroot") {
		http.Redirect(res, req, "/404", http.StatusSeeOther)
		return
	}

	filePath := strings.TrimPrefix(requestedFilename, "/localroot")

	if req.Method == "POST" {
		body, err := io.ReadAll(req.Body)

		if err != nil {
			println(err)
			res.WriteHeader(http.StatusBadRequest)
			res.Write([]byte(requestedFilename))
			return
		}

		err = os.WriteFile(filePath, body, 0644)

		if err != nil {
			println(err)
			res.WriteHeader(http.StatusBadRequest)
			res.Write([]byte(requestedFilename))
			return
		}

		res.WriteHeader(http.StatusCreated)

		return
	}

	fileData, err := os.ReadFile(filePath)

	if err != nil {
		res.WriteHeader(http.StatusNotFound)
		return
	}

	mtype := mimetype.Detect(fileData).String()

	if mtype == "audio/x-m4a" {
		mtype = "video/mp4"
	}

	res.Header().Set("Content-Type", mtype)

	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Look at me! I recovered from panic: ", r)

		}
	}()

	res.Write(fileData)
}

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "PulseFlow",
		Width:  1024,
		Height: 768,
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
		},
		AssetServer: &assetserver.Options{
			Assets:  assets,
			Handler: NewFileLoader(),
		},
		BackgroundColour: &options.RGBA{R: 18, G: 18, B: 18, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		LogLevel: logger.ERROR,
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
