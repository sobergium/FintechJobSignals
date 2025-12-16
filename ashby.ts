/**
 * Ashby ATS Scraper
 * 
 * Ashby uses a GraphQL-style API
 * URL pattern: https://jobs.ashbyhq.com/{company}
 * API: https://jobs.ashbyhq.com/api/non-user-graphql
 */

import type { CompanyConfig, Job } from "../index.ts";

interface AshbyJob {
  id: string;
  title: string;
  location: string;
  department: string;
  employmentType: string;
}

interface AshbyResponse {
  data: {
    jobBoard: {
      jobPostings: AshbyJob[];
    };
  };
}

export async function fetchAshbyJobs(company: CompanyConfig): Promise<Job[]> {
  const apiUrl = "https://jobs.ashbyhq.com/api/non-user-graphql";
  
  const query = {
    operationName: "ApiJobBoardWithTeams",
    variables: {
      organizationHostedJobsPageName: company.slug,
    },
    query: `
      query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
        jobBoard: jobBoardWithTeams(
          organizationHostedJobsPageName: $organizationHostedJobsPageName
        ) {
          jobPostings {
            id
            title
            location
            department
            employmentType
          }
        }
      }
    `,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "JobScout/1.0 (github.com/yourrepo/job-scout)",
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`Ashby API error: ${response.status}`);
    }

    const data: AshbyResponse = await response.json();
    
    if (!data.data?.jobBoard?.jobPostings) {
      console.warn(`No job postings found for ${company.slug} on Ashby`);
      return [];
    }

    return data.data.jobBoard.jobPostings.map((job): Job => ({
      id: `ashby-${company.slug}-${job.id}`,
      company: company.name,
      title: job.title,
      location: job.location || "Not specified",
      url: `https://jobs.ashbyhq.com/${company.slug}/${job.id}`,
      department: job.department,
    }));
  } catch (error) {
    console.error(`Error fetching Ashby jobs for ${company.name}:`, error);
    throw error;
  }
}
