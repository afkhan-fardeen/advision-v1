import { supabase } from "./supabase";
import DOMPurify from "dompurify";

/**
 * Generates a minimal, compact report with simple tables for a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<string>} - The sanitized HTML content of the report.
 */
export async function generateReport(projectId, userId) {
  try {
    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, name, product_service, target_platform, primary_goal, product_description, product_features"
      )
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (projectError || !project) {
      throw new Error(
        projectError?.message || "Project not found or access denied."
      );
    }

    // Fetch ad copies with readability scores
    const { data: adCopies, error: adCopiesError } = await supabase
      .from("ad_copies")
      .select(
        "id, content, tone, created_at, readability_scores(id, flesch_reading_ease, flesch_grade_level, gunning_fog, flesch_reading_ease_label, flesch_grade_level_label, gunning_fog_label)"
      )
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (adCopiesError) {
      throw new Error("Failed to fetch ad copies: " + adCopiesError.message);
    }

    // Fetch keywords
    const { data: keywords, error: keywordsError } = await supabase
      .from("keywords")
      .select(
        "id, keyword, search_volume, competition, intent, suggestions, created_at"
      )
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (keywordsError) {
      throw new Error("Failed to fetch keywords: " + keywordsError.message);
    }

    // Fetch audiences
    const { data: audiences, error: audiencesError } = await supabase
      .from("audiences")
      .select(
        "id, name, age_range, gender, interests, platforms, purchase_intent, created_at"
      )
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (audiencesError) {
      throw new Error("Failed to fetch audiences: " + audiencesError.message);
    }

    // Fetch brand styles
    const { data: brandStyles, error: brandStylesError } = await supabase
      .from("brand_styles")
      .select("id, brand_name, colors, font, created_at")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (brandStylesError) {
      throw new Error("Failed to fetch brand styles: " + brandStylesError.message);
    }

    // Helper function for readability label colors
    const getReadabilityColor = (label) => {
      switch (label) {
        case "Good":
          return "#2E7D32"; // Green
        case "Fair":
          return "#FBC02D"; // Yellow
        case "Bad":
          return "#FF3B30"; // Red
        default:
          return "#6E6E73"; // Gray
      }
    };

    // Helper function for keyword intent colors
    const getIntentColor = (intent) => {
      switch (intent) {
        case "Informational":
          return "#0288D1"; // Blue
        case "Transactional":
          return "#2E7D32"; // Green
        case "Brand-related":
          return "#7B1FA2"; // Purple
        default:
          return "#6E6E73"; // Gray
      }
    };

    // Generate report HTML
    const reportHtml = `
      <div class="report-container">
        <style>
          .report-container {
            font-family: 'Arial', sans-serif;
            padding: 10px;
            color: #333;
            width: 1123px; /* A4 landscape width at 96dpi */
            min-height: 794px; /* A4 landscape height at 96dpi */
            margin: 0;
            line-height: 1.3;
            box-sizing: border-box;
          }
          .report-header {
            text-align: center;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 14px;
            color: #000;
            margin: 0;
          }
          .report-date {
            font-size: 8px;
            color: #666;
            margin-top: 2px;
          }
          .report-section {
            margin-bottom: 10px;
            padding: 5px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 10px;
            color: #000;
            margin-bottom: 5px;
          }
          .section-divider {
            border: 0;
            border-top: 1px solid #ccc;
            margin: 5px 0;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 3px;
            font-size: 8px;
            table-layout: auto;
          }
          .data-table th, .data-table td {
            padding: 3px 5px;
            text-align: left;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .data-table th {
            background-color: #eee;
            font-weight: bold;
            color: #000;
          }
          .data-table td {
            color: #333;
          }
          .readability-table .badge {
            padding: 2px 4px;
            font-size: 8px;
            font-weight: normal;
          }
          .keyword-table .badge {
            padding: 2px 4px;
            font-size: 8px;
            font-weight: normal;
          }
          .field-list {
            list-style-type: none;
            padding: 0;
            margin: 0;
          }
          .field-list li {
            margin: 2px 0;
            font-size: 8px;
          }
          .field-table {
            width: 100%;
            font-size: 8px;
            margin-top: 3px;
            table-layout: fixed;
          }
          .field-table th, .field-table td {
            padding: 3px 5px;
            text-align: left;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .field-table th {
            font-weight: bold;
            color: #000;
            width: 25%;
          }
          .field-table td {
            color: #333;
          }
          .color-swatches {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            margin-top: 3px;
          }
          .color-swatch {
            width: 16px;
            height: 16px;
            display: inline-block;
          }
          @media print {
            .report-container {
              width: 1123px;
              min-height: 794px;
              padding: 5px;
              margin: 0;
            }
            .report-section {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .data-table, .field-table {
              page-break-inside: auto;
              break-inside: auto;
            }
            .data-table tr, .field-table tr {
              page-break-inside: avoid;
              break-inside: avoid;
              page-break-after: auto;
              break-after: auto;
            }
            .section-divider {
              page-break-before: always;
              break-before: always;
            }
          }
        </style>

        <header class="report-header">
          <h1 class="report-title">Campaign Report</h1>
          <p class="report-date">Project: ${DOMPurify.sanitize(project.name)}</p>
          <p class="report-date">Generated on: ${new Date().toLocaleDateString()}</p>
        </header>

        <section class="report-section">
          <h2 class="section-title">Project Overview</h2>
          <table class="field-table">
            <tr>
              <th>Product/Service</th>
              <td>${DOMPurify.sanitize(project.product_service)}</td>
            </tr>
            <tr>
              <th>Target Platform</th>
              <td>${DOMPurify.sanitize(project.target_platform)}</td>
            </tr>
            <tr>
              <th>Primary Goal</th>
              <td>${DOMPurify.sanitize(project.primary_goal)}</td>
            </tr>
            <tr>
              <th>Description</th>
              <td>${DOMPurify.sanitize(project.product_description)}</td>
            </tr>
          </table>
        </section>

        <section class="report-section">
          <h2 class="section-title">Features</h2>
          <ul class="field-list">
            ${
              project.product_features
                ? project.product_features
                    .split("\n")
                    .filter((f) => f.trim())
                    .map((feature) => `<li>${DOMPurify.sanitize(feature)}</li>`)
                    .join("")
                : "<li>No features provided.</li>"
            }
          </ul>
        </section>

        <hr class="section-divider">

        <section class="report-section">
          <h2 class="section-title">Ad Copies</h2>
          ${
            adCopies.length > 0
              ? adCopies
                  .map(
                    (ad, index) => `
                      <div style="margin-bottom: 5px;">
                        <h3 style="font-size: 10px; color: #000;">
                          Copy ${index + 1}: ${
                            index === 0 ? "Headline" : "Extended Ad Content"
                          }
                        </h3>
                        <p style="font-size: 8px; color: #333; margin: 2px 0;">"${
                          index === 0
                            ? DOMPurify.sanitize(ad.content.split('\n')[0])
                            : DOMPurify.sanitize(ad.content)
                        }"</p>
                        <p style="font-size: 8px; color: #666; margin: 1px 0;">
                          Tone: ${DOMPurify.sanitize(ad.tone)}
                        </p>
                        <p style="font-size: 8px; color: #666; margin: 1px 0;">
                          Created on: ${new Date(ad.created_at).toLocaleString()}
                        </p>
                        ${
                          ad.readability_scores.length > 0
                            ? `
                              <h4 style="font-size: 9px; color: #000; margin-top: 3px;">
                                Readability Scores:
                              </h4>
                              <table class="data-table readability-table">
                                <thead>
                                  <tr>
                                    <th style="width: 40%;">Metric</th>
                                    <th style="width: 30%;">Score</th>
                                    <th style="width: 30%;">Label</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>Flesch Reading Ease</td>
                                    <td>${
                                      ad.readability_scores[0].flesch_reading_ease
                                    }</td>
                                    <td>
                                      <span class="badge readability-badge" style="background-color: ${getReadabilityColor(
                                        ad.readability_scores[0]
                                          .flesch_reading_ease_label
                                      )}20; color: ${getReadabilityColor(
                                        ad.readability_scores[0]
                                          .flesch_reading_ease_label
                                      )}">
                                        ${
                                          ad.readability_scores[0]
                                            .flesch_reading_ease_label
                                        }
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Flesch Grade Level</td>
                                    <td>${
                                      ad.readability_scores[0].flesch_grade_level
                                    }</td>
                                    <td>
                                      <span class="badge readability-badge" style="background-color: ${getReadabilityColor(
                                        ad.readability_scores[0]
                                          .flesch_grade_level_label
                                      )}20; color: ${getReadabilityColor(
                                        ad.readability_scores[0]
                                          .flesch_grade_level_label
                                      )}">
                                        ${
                                          ad.readability_scores[0]
                                            .flesch_grade_level_label
                                        }
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Gunning Fog</td>
                                    <td>${ad.readability_scores[0].gunning_fog}</td>
                                    <td>
                                      <span class="badge readability-badge" style="background-color: ${getReadabilityColor(
                                        ad.readability_scores[0].gunning_fog_label
                                      )}20; color: ${getReadabilityColor(
                                        ad.readability_scores[0].gunning_fog_label
                                      )}">
                                        ${
                                          ad.readability_scores[0].gunning_fog_label
                                        }
                                      </span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            `
                            : '<p style="font-size: 8px; color: #666;">No readability scores available.</p>'
                        }
                      </div>
                    `
                  )
                  .join("")
              : '<p style="font-size: 8px; color: #666;">No ad copies available.</p>'
          }
        </section>

        <hr class="section-divider">

        <section class="report-section">
          <h2 class="section-title">Keywords Research</h2>
          ${
            keywords.length > 0
              ? `
                  <table class="data-table keyword-table">
                    <thead>
                      <tr>
                        <th style="width: 20%;">Keyword</th>
                        <th style="width: 15%;">Search Volume</th>
                        <th style="width: 15%;">Competition</th>
                        <th style="width: 15%;">Intent</th>
                        <th style="width: 20%;">Suggestion</th>
                        <th style="width: 15%;">Created On</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${keywords
                        .map(
                          (kw) => `
                            <tr>
                              <td>${DOMPurify.sanitize(kw.keyword)}</td>
                              <td>${kw.search_volume}</td>
                              <td>${kw.competition}</td>
                              <td>
                                <span class="badge keyword-badge" style="background-color: ${getIntentColor(
                                  kw.intent
                                )}20; color: ${getIntentColor(kw.intent)}">
                                  ${DOMPurify.sanitize(kw.intent)}
                                </span>
                              </td>
                              <td>
                                ${
                                  kw.suggestions?.length > 0
                                    ? DOMPurify.sanitize(
                                        kw.suggestions.join(", ")
                                      )
                                    : "None"
                                }
                              </td>
                              <td>${new Date(
                                kw.created_at
                              ).toLocaleString()}</td>
                            </tr>
                          `
                        )
                        .join("")}
                    </tbody>
                  </table>
                `
              : '<p style="font-size: 8px; color: #666;">No keywords available.</p>'
          }
        </section>

        <hr class="section-divider">

        <section class="report-section">
          <h2 class="section-title">Target Audiences</h2>
          ${
            audiences.length > 0
              ? `
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th style="width: 15%;">Audience Name</th>
                        <th style="width: 10%;">Age Range</th>
                        <th style="width: 10%;">Gender</th>
                        <th style="width: 25%;">Interests</th>
                        <th style="width: 25%;">Platforms</th>
                        <th style="width: 15%;">Purchase Intent</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${audiences
                        .map(
                          (aud) => `
                            <tr>
                              <td>${DOMPurify.sanitize(aud.name)}</td>
                              <td>${DOMPurify.sanitize(aud.age_range)}</td>
                              <td>${DOMPurify.sanitize(aud.gender)}</td>
                              <td>${DOMPurify.sanitize(aud.interests)}</td>
                              <td>${DOMPurify.sanitize(aud.platforms)}</td>
                              <td>${
                                aud.purchase_intent
                                  ? DOMPurify.sanitize(aud.purchase_intent)
                                  : "None"
                              }</td>
                            </tr>
                          `
                        )
                        .join("")}
                    </tbody>
                  </table>
                `
              : '<p style="font-size: 8px; color: #666;">No audiences available.</p>'
          }
        </section>

        <hr class="section-divider">

        <section class="report-section">
          <h2 class="section-title">Brand Styling</h2>
          ${
            brandStyles.length > 0
              ? brandStyles
                  .map(
                    (style) => `
                      <table class="field-table">
                        <tr>
                          <th>Brand Name</th>
                          <td>${DOMPurify.sanitize(style.brand_name)}</td>
                        </tr>
                        <tr>
                          <th>Brand Colors</th>
                          <td>
                            <div class="color-swatches">
                              ${
                                style.colors && style.colors.length > 0
                                  ? style.colors
                                      .map(
                                        (color) =>
                                          `<span class="color-swatch" style="background-color: ${color};" title="${color}"></span>`
                                      )
                                      .join("")
                                  : "None"
                              }
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th>Font</th>
                          <td>${
                            style.font ? DOMPurify.sanitize(style.font) : "None"
                          }</td>
                        </tr>
                      </table>
                    `
                  )
                  .join("")
              : '<p style="font-size: 8px; color: #666;">No brand styles available.</p>'
          }
        </section>
      </div>
    `;

    // Sanitize and return the HTML, allowing style attributes for swatches and badges
    return DOMPurify.sanitize(reportHtml, { ADD_ATTR: ["style"] });
  } catch (err) {
    console.error("Report generation error:", err.message);
    throw new Error("Failed to generate report: " + err.message);
  }
}