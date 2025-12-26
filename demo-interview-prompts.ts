#!/usr/bin/env tsx
/**
 * Demonstration Script: AI Interview Quality Improvements
 *
 * This script demonstrates the realistic company names, job titles,
 * and guardrails now present in the interview prompts.
 *
 * Run: npx tsx demo-interview-prompts.ts
 */

import { generateInterviewPrompt, Industry, Difficulty } from './src/lib/interview-prompts.js';

function extractKeyInfo(prompt: string) {
  const companyMatch = prompt.match(/YOUR COMPANY: (.+)/);
  const titleMatch = prompt.match(/YOUR TITLE: (.+)/);
  const introMatch = prompt.match(/INTRODUCTION EXAMPLE[^"]*"([^"]+)"/);

  return {
    company: companyMatch ? companyMatch[1] : 'Not found',
    title: titleMatch ? titleMatch[1] : 'Not found',
    intro: introMatch ? introMatch[1] : 'Not found',
  };
}

console.log('\n' + '='.repeat(100));
console.log('AI INTERVIEW PLATFORM - QUALITY IMPROVEMENTS DEMONSTRATION');
console.log('='.repeat(100) + '\n');

const demos: Array<{ industry: Industry; role: string; difficulty: Difficulty }> = [
  { industry: 'technology', role: 'Senior Software Engineer', difficulty: 'senior' },
  { industry: 'finance', role: 'Investment Banking Analyst', difficulty: 'entry-level' },
  { industry: 'healthcare', role: 'Nurse Practitioner', difficulty: 'mid-level' },
  { industry: 'marketing', role: 'Growth Marketing Manager', difficulty: 'senior' },
  { industry: 'sales', role: 'Enterprise Account Executive', difficulty: 'mid-level' },
  { industry: 'consulting', role: 'Strategy Consultant', difficulty: 'senior' },
  { industry: 'education', role: 'Middle School Math Teacher', difficulty: 'entry-level' },
  { industry: 'engineering', role: 'Aerospace Engineer', difficulty: 'senior' },
];

demos.forEach((demo, index) => {
  console.log(`EXAMPLE ${index + 1}: ${demo.difficulty.toUpperCase()} ${demo.role.toUpperCase()}`);
  console.log('-'.repeat(100));

  const prompt = generateInterviewPrompt(demo.industry, demo.role, demo.difficulty);
  const info = extractKeyInfo(prompt);

  console.log(`Industry:     ${demo.industry.charAt(0).toUpperCase() + demo.industry.slice(1)}`);
  console.log(`Company:      ${info.company}`);
  console.log(`Title:        ${info.title}`);
  console.log(`Introduction: ${info.intro.substring(0, 120)}...`);

  // Check for quality
  const hasPlaceholders = info.intro.includes('(name)') || info.intro.includes('(company)');
  const hasRealCompany = !info.company.includes('(') && !info.company.includes('[');

  console.log(`Quality:      ${hasRealCompany && !hasPlaceholders ? '✅ PASS' : '❌ FAIL'}`);
  console.log();
});

console.log('='.repeat(100));
console.log('VARIETY TEST: Multiple generations of the same role');
console.log('='.repeat(100) + '\n');

console.log('Generating 10 technology interviews to show variety:\n');

for (let i = 1; i <= 10; i++) {
  const prompt = generateInterviewPrompt('technology', 'Software Engineer', 'mid-level');
  const info = extractKeyInfo(prompt);
  console.log(`${i.toString().padStart(2)}. ${info.company.padEnd(35)} | ${info.title}`);
}

console.log('\n' + '='.repeat(100));
console.log('GUARDRAILS VERIFICATION');
console.log('='.repeat(100) + '\n');

const testPrompt = generateInterviewPrompt('technology', 'Software Engineer', 'mid-level');

const checks = [
  { name: 'Contains CRITICAL GUARDRAILS section', pass: testPrompt.includes('CRITICAL GUARDRAILS') },
  { name: 'Contains INTERVIEW FLOW CONTROL', pass: testPrompt.includes('INTERVIEW FLOW CONTROL') },
  { name: 'Contains PRESSURE TACTICS', pass: testPrompt.includes('PRESSURE TACTICS') },
  { name: 'Contains RESPONSE FORMAT guidelines', pass: testPrompt.includes('RESPONSE FORMAT') },
  { name: 'Contains INTRODUCTION EXAMPLE', pass: testPrompt.includes('INTRODUCTION EXAMPLE') },
  { name: 'Contains "Ask ONE question at a time"', pass: testPrompt.includes('Ask ONE question at a time') },
  { name: 'Contains "NEVER use placeholders"', pass: testPrompt.includes('NEVER use placeholders') },
  { name: 'Contains "maintain professional distance"', pass: testPrompt.includes('slight evaluative distance') },
  { name: 'Real company name provided', pass: testPrompt.includes('YOUR COMPANY:') && !testPrompt.match(/YOUR COMPANY:.*\(company\)/) },
  { name: 'Real job title provided', pass: testPrompt.includes('YOUR TITLE:') && !testPrompt.match(/YOUR TITLE:.*\(title\)/) },
];

checks.forEach((check) => {
  console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
});

const passedCount = checks.filter((c) => c.pass).length;
const totalCount = checks.length;

console.log('\n' + '='.repeat(100));
console.log(`RESULT: ${passedCount}/${totalCount} checks passed`);

if (passedCount === totalCount) {
  console.log('✅ ALL QUALITY CHECKS PASSED!');
} else {
  console.log(`❌ ${totalCount - passedCount} checks failed`);
}

console.log('='.repeat(100) + '\n');
