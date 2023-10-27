package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type Config struct {
	SetupDone        bool     `json:"setup_done"`
	Version          int      `json:"version"`
	MusicDirectories []string `json:"music_directories"`
}

func getConfigFilePath() (string, error) {
	var configDir, configFile string

	// Get the user's home directory on Unix or %APPDATA% on Windows
	if osname := runtime.GOOS; osname == "windows" {
		configDir = os.Getenv("APPDATA")
	} else {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		configDir = filepath.Join(homeDir, ".config")
	}

	configFile = filepath.Join(configDir, "pulseflow", "config.json")
	return configFile, nil
}

func ensureDirectoryExists(path string) error {
	err := os.MkdirAll(path, 0755)
	if err != nil {
		return err
	}
	return nil
}

func (a *App) GetOrCreateConfig() (*Config, error) {
	configFile, err := getConfigFilePath()
	if err != nil {
		return nil, err
	}

	// Ensure the directory structure exists
	configDir := filepath.Dir(configFile)
	if err := ensureDirectoryExists(configDir); err != nil {
		return nil, err
	}

	// Try to open the config file
	file, err := os.OpenFile(configFile, os.O_RDWR|os.O_CREATE, 0644)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	config := &Config{}
	if info, err := file.Stat(); err == nil && info.Size() > 0 {
		// Config file exists and is not empty, decode it
		decoder := json.NewDecoder(file)
		if err := decoder.Decode(config); err != nil {
			return nil, err
		}
	} else {
		// Config file doesn't exist or is empty, create it with default values
		if err := json.NewEncoder(file).Encode(config); err != nil {
			return nil, err
		}
	}

	return config, nil
}

func (a *App) SaveConfig(config *Config) error {
	configFile, err := getConfigFilePath()
	if err != nil {
		return err
	}

	// Ensure the directory structure exists
	configDir := filepath.Dir(configFile)
	if err := ensureDirectoryExists(configDir); err != nil {
		return err
	}

	// Open the config file for writing
	file, err := os.OpenFile(configFile, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	// Encode and save the updated config
	encoder := json.NewEncoder(file)
	if err := encoder.Encode(config); err != nil {
		return err
	}

	return nil
}

func (a *App) ResetConfig() (*Config, error) {
	// Create a new default configuration
	defaultConfig := &Config{
		SetupDone:        false,
		Version:          1,
		MusicDirectories: []string{},
	}

	// Save the default configuration to the file
	if err := a.SaveConfig(defaultConfig); err != nil {
		return nil, err
	}

	return defaultConfig, nil
}

func (a *App) WalkDir(path string) ([]string, error) {
	var files []string

	err := filepath.Walk(path, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			files = append(files, path)
		}
		return nil
	})

	return files, err
}

func (a *App) GetHomeDir() (string, error) {
	homeDir, err := os.UserHomeDir()

	if err != nil {
		return "", err
	}

	return homeDir, nil
}

func (a *App) PickDirectory(title string) (string, error) {
	dir, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title:                title,
		CanCreateDirectories: true,
	})

	if err != nil {
		return "", err
	}

	return dir, nil
}

func (a *App) SplitPath(path string) []string {
	return strings.Split(filepath.ToSlash(path), "/")
}

func (a *App) JoinPath(paths ...string) string {
	return strings.Join(paths, string(os.PathSeparator))
}

func (a *App) GetOrCreateCacheDir() (string, error) {
	base, err := os.UserCacheDir()

	if err != nil {
		return "", err
	}

	dir := filepath.Join(base, "pulseflow")

	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return "", err
		}
	}

	return dir, nil
}
