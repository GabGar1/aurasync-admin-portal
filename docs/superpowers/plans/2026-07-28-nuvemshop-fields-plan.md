# Nuvemshop Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `payment_status`, `fulfillment_status`, `has_free_shipping`, `items[].has_promotional_price`, `variants[].has_promotional_price` fields to the admin portal and update order status values to Nuvemshop format.

**Architecture:** Incremental changes to existing files — types → formatters → detail components → pages → dashboard. No new files.

**Tech Stack:** TypeScript, React, TailwindCSS, shadcn/ui

---
