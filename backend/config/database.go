package config

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func ConnectDB() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Default Supabase / PG string fallback
		dbURL = "postgresql://postgres:password@localhost:5432/bimbel_db?sslmode=disable"
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Gagal parse konfigurasi PostgreSQL database: %v", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Gagal terhubung ke PostgreSQL Supabase: %v", err)
	}

	err = pool.Ping(context.Background())
	if err != nil {
		log.Printf("Peringatan: Database belum dapat di-ping (%v). Aplikasi tetap berjalan.", err)
	} else {
		fmt.Println("Berhasil terhubung ke Supabase PostgreSQL Database Engine!")
	}

	DB = pool
}
