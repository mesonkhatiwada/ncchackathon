package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

type User struct {
	ID                 int       `json:"id"`
	Email              string    `json:"email"`
	Name               string    `json:"name"`
	UserType           string    `json:"userType"`
	Avatar             string    `json:"avatar"`
	VerificationStatus string    `json:"verificationStatus"`
	CreatedAt          time.Time `json:"createdAt"`
}

type Testimonial struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	Name      string    `json:"name"`
	Avatar    string    `json:"avatar"`
	Rating    int       `json:"rating"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"createdAt"`
}

type Donation struct {
	ID            int       `json:"id"`
	UserID        int       `json:"userId"`
	Amount        float64   `json:"amount"`
	PaymentMethod string    `json:"paymentMethod"`
	Remarks       string    `json:"remarks"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"createdAt"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

var (
	users        []User
	testimonials []Testimonial
	donations    []Donation
	userIDCounter = 1
	testimonialIDCounter = 1
	donationIDCounter = 1
)

func main() {
	initializeData()

	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("../frontend"))
	mux.Handle("/", http.StripPrefix("/", fs))

	mux.HandleFunc("/api/health", healthCheckHandler)
	mux.HandleFunc("/api/users", usersHandler)
	mux.HandleFunc("/api/testimonials", testimonialsHandler)
	mux.HandleFunc("/api/donations", donationsHandler)
	mux.HandleFunc("/api/stats", statsHandler)

	corsHandler := enableCORS(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      corsHandler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	fmt.Printf("\nHamroCare Backend Server Starting...\n")
	fmt.Printf(" Serving frontend from: %s\n", filepath.Join("..", "frontend"))
	fmt.Printf(" Server running on: http://localhost:%s\n", port)
	fmt.Printf(" API endpoints available at: http://localhost:%s/api/\n", port)
	fmt.Printf(" Press Ctrl+C to stop the server\n\n")

	log.Fatal(server.ListenAndServe())
}

func initializeData() {
	users = []User{
		{
			ID:                 userIDCounter,
			Email:              "admin@hamrocare.com",
			Name:               "Admin User",
			UserType:           "admin",
			Avatar:             "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
			VerificationStatus: "approved",
			CreatedAt:          time.Now().AddDate(0, -6, 0),
		},
	}
	userIDCounter++

	testimonials = []Testimonial{
		{
			ID:        testimonialIDCounter,
			UserID:    1,
			Name:      "Anjali Sharma",
			Avatar:    "https://api.dicebear.com/7.x/avataaars/svg?seed=anjali",
			Rating:    5,
			Text:      "HamroCare helped me find the perfect companion! The adoption process was smooth and the staff was incredibly supportive.",
			CreatedAt: time.Now().AddDate(0, 0, -5),
		},
	}
	testimonialIDCounter++

	donations = []Donation{
		{
			ID:            donationIDCounter,
			UserID:        1,
			Amount:        5000.00,
			PaymentMethod: "esewa",
			Remarks:       "For animal welfare",
			Status:        "completed",
			CreatedAt:     time.Now().AddDate(0, 0, -3),
		},
	}
	donationIDCounter++
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	response := APIResponse{
		Success: true,
		Message: "HamroCare API is running smoothly",
		Data: map[string]interface{}{
			"timestamp": time.Now(),
			"status":    "healthy",
			"version":   "1.0.0",
		},
	}
	sendJSONResponse(w, http.StatusOK, response)
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		response := APIResponse{
			Success: true,
			Message: "Users retrieved successfully",
			Data:    users,
		}
		sendJSONResponse(w, http.StatusOK, response)

	case "POST":
		var newUser User
		if err := json.NewDecoder(r.Body).Decode(&newUser); err != nil {
			response := APIResponse{
				Success: false,
				Message: "Invalid request body",
			}
			sendJSONResponse(w, http.StatusBadRequest, response)
			return
		}

		newUser.ID = userIDCounter
		newUser.CreatedAt = time.Now()
		if newUser.VerificationStatus == "" {
			if newUser.UserType == "user" {
				newUser.VerificationStatus = "approved"
			} else {
				newUser.VerificationStatus = "pending"
			}
		}

		users = append(users, newUser)
		userIDCounter++

		response := APIResponse{
			Success: true,
			Message: "User created successfully",
			Data:    newUser,
		}
		sendJSONResponse(w, http.StatusCreated, response)

	default:
		response := APIResponse{
			Success: false,
			Message: "Method not allowed",
		}
		sendJSONResponse(w, http.StatusMethodNotAllowed, response)
	}
}

func testimonialsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		response := APIResponse{
			Success: true,
			Message: "Testimonials retrieved successfully",
			Data:    testimonials,
		}
		sendJSONResponse(w, http.StatusOK, response)

	case "POST":
		var newTestimonial Testimonial
		if err := json.NewDecoder(r.Body).Decode(&newTestimonial); err != nil {
			response := APIResponse{
				Success: false,
				Message: "Invalid request body",
			}
			sendJSONResponse(w, http.StatusBadRequest, response)
			return
		}

		newTestimonial.ID = testimonialIDCounter
		newTestimonial.CreatedAt = time.Now()
		testimonials = append(testimonials, newTestimonial)
		testimonialIDCounter++

		response := APIResponse{
			Success: true,
			Message: "Testimonial posted successfully",
			Data:    newTestimonial,
		}
		sendJSONResponse(w, http.StatusCreated, response)

	default:
		response := APIResponse{
			Success: false,
			Message: "Method not allowed",
		}
		sendJSONResponse(w, http.StatusMethodNotAllowed, response)
	}
}

func donationsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		response := APIResponse{
			Success: true,
			Message: "Donations retrieved successfully",
			Data:    donations,
		}
		sendJSONResponse(w, http.StatusOK, response)

	case "POST":
		var newDonation Donation
		if err := json.NewDecoder(r.Body).Decode(&newDonation); err != nil {
			response := APIResponse{
				Success: false,
				Message: "Invalid request body",
			}
			sendJSONResponse(w, http.StatusBadRequest, response)
			return
		}

		newDonation.ID = donationIDCounter
		newDonation.Status = "completed"
		newDonation.CreatedAt = time.Now()
		donations = append(donations, newDonation)
		donationIDCounter++

		response := APIResponse{
			Success: true,
			Message: fmt.Sprintf("Payment successful! Thank you for donating NPR %.2f", newDonation.Amount),
			Data:    newDonation,
		}
		sendJSONResponse(w, http.StatusCreated, response)

	default:
		response := APIResponse{
			Success: false,
			Message: "Method not allowed",
		}
		sendJSONResponse(w, http.StatusMethodNotAllowed, response)
	}
}

func statsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		response := APIResponse{
			Success: false,
			Message: "Method not allowed",
		}
		sendJSONResponse(w, http.StatusMethodNotAllowed, response)
		return
	}

	totalDonations := 0.0
	for _, donation := range donations {
		totalDonations += donation.Amount
	}

	stats := map[string]interface{}{
		"totalUsers":        len(users),
		"totalTestimonials": len(testimonials),
		"totalDonations":    len(donations),
		"totalAmount":       totalDonations,
		"animalsRescued":    2450,
		"adoptions":         1800,
		"partnerShelters":   50,
	}

	response := APIResponse{
		Success: true,
		Message: "Statistics retrieved successfully",
		Data:    stats,
	}
	sendJSONResponse(w, http.StatusOK, response)
}

func sendJSONResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}