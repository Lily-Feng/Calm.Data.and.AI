package main

import (
	"fmt"
	"net/http"
	"sync"
)

type Result struct {
	URL    string
	Status int
	Size   int64
	Error  error
}

func worker(urls <-chan string, results chan<- Result, wg *sync.WaitGroup) {
	defer wg.Done()
	for url := range urls {
		resp, err := http.Get(url)
		if err != nil {
			results <- Result{URL: url, Error: err}
			continue
		}
		results <- Result{
			URL:    url,
			Status: resp.StatusCode,
			Size:   resp.ContentLength,
		}
		resp.Body.Close()
	}
}

func FetchAll(urls []string, maxWorkers int) []Result {
	urlChan := make(chan string, len(urls))
	resultChan := make(chan Result, len(urls))

	var wg sync.WaitGroup

	// Start worker pool
	for i := 0; i < maxWorkers; i++ {
		wg.Add(1)
		go worker(urlChan, resultChan, &wg)
	}

	// Send URLs to workers
	for _, url := range urls {
		urlChan <- url
	}
	close(urlChan)

	// Wait and collect results
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	var results []Result
	for result := range resultChan {
		results = append(results, result)
	}
	return results
}

func main() {
	urls := []string{
		"https://golang.org",
		"https://google.com",
		"https://github.com",
		"https://stackoverflow.com",
		"https://reddit.com",
	}

	results := FetchAll(urls, 3)
	for _, r := range results {
		if r.Error != nil {
			fmt.Printf("❌ %s: %v\n", r.URL, r.Error)
		} else {
			fmt.Printf("✅ %s: Status=%d, Size=%d\n", r.URL, r.Status, r.Size)
		}
	}
}
