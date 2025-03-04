import { Router } from "express";
import { AppDataSource } from "../config/database";
import { Quote } from "../models/Quote";
import { z } from "zod";
import { auth } from "../middleware/auth";

const router = Router();
const quoteRepository = AppDataSource.getRepository(Quote);

// Validation schema
const quoteSchema = z.object({
  content: z.string().min(1, "Quote content is required"),
  author: z.string().optional(),
  category: z.string().optional(),
});

// Public endpoints
// Get all quotes (no auth required)
router.get("/", async (req, res) => {
  try {
    const quotes = await quoteRepository.find({
      order: { createdAt: "DESC" },
    });
    res.json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({
      message: "Failed to fetch quotes",
    });
  }
});

// Get a random quote (no auth required)
router.get("/random", async (req, res) => {
  try {
    const [quote] = await quoteRepository
      .createQueryBuilder("quote")
      .orderBy("RANDOM()")
      .limit(1)
      .getMany();

    if (!quote) {
      return res.status(404).json({
        message: "No quotes available",
      });
    }

    res.json(quote);
  } catch (error) {
    console.error("Error fetching random quote:", error);
    res.status(500).json({
      message: "Failed to fetch random quote",
    });
  }
});

// Protected endpoints (require authentication)
// Get a single quote
router.get("/:id", auth, async (req, res) => {
  try {
    const quote = await quoteRepository.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!quote) {
      return res.status(404).json({
        message: "Quote not found",
      });
    }

    res.json(quote);
  } catch (error) {
    console.error("Error fetching quote:", error);
    res.status(500).json({
      message: "Failed to fetch quote",
    });
  }
});

// Create a new quote
router.post("/", auth, async (req, res) => {
  try {
    console.log('Creating new quote with data:', req.body);
    const quoteData = quoteSchema.parse(req.body);
    console.log('Validated quote data:', quoteData);
    
    const quote = quoteRepository.create(quoteData);
    console.log('Created quote entity:', quote);
    
    await quoteRepository.save(quote);
    console.log('Successfully saved quote to database');
    
    res.status(201).json(quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    } else if (error instanceof Error) {
      console.error("Error creating quote:", {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({
        message: "Failed to create quote",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      console.error("Unknown error creating quote:", error);
      res.status(500).json({
        message: "Failed to create quote",
        error: process.env.NODE_ENV === 'development' ? 'Unknown error occurred' : undefined
      });
    }
  }
});

// Update a quote
router.put("/:id", auth, async (req, res) => {
  try {
    const quoteData = quoteSchema.parse(req.body);
    const quote = await quoteRepository.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!quote) {
      return res.status(404).json({
        message: "Quote not found",
      });
    }

    quoteRepository.merge(quote, quoteData);
    await quoteRepository.save(quote);
    res.json(quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    } else {
      console.error("Error updating quote:", error);
      res.status(500).json({
        message: "Failed to update quote",
      });
    }
  }
});

// Delete a quote
router.delete("/:id", auth, async (req, res) => {
  try {
    const quote = await quoteRepository.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!quote) {
      return res.status(404).json({
        message: "Quote not found",
      });
    }

    await quoteRepository.remove(quote);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting quote:", error);
    res.status(500).json({
      message: "Failed to delete quote",
    });
  }
});

export default router; 