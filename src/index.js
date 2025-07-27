// npm install langchain
import { CloudflareWorkersAIEmbeddings } from 'langchain/embeddings/cloudflare_workersai';
import { CloudflareVectorizeStore } from 'langchain/vectorstores/cloudflare_vectorize';

// Define interfaces
/**
 * @typedef {Object} VectorizeVector
 * @property {string} id - Unique identifier for the vector
 * @property {number[]} values - The vector embedding values
 * @property {Object} [metadata] - Optional metadata associated with the vector
 */

/**
 * @typedef {Object} Env
 * @property {Vectorize} VECTORIZE_INDEX - Vectorize V2 interface
 * @property {AI} AI - Native Workers AI binding
 * @property {D1Database} DB - D1 database binding
 */

export default {
	async fetch(request, env, ctx) {
		// Cross-Origin Resource Sharing (CORS)
		// Handle Preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': '*',
				},
			});
		}
		// Set CORS headers for all other requests
		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': '*',
			'Content-Type': 'application/json;charset=UTF-8',
		};

		// AI BINDING
		const ai = env.AI;

		// USER QUERY
		const url = new URL(request.url);
		let query = url.searchParams.get('query') || 'Where can I find more information on Data Localization Suite (DLS)?';
		// Limit the query to a maximum of 500 characters
		if (query.length > 500) {
			console.warn('Warning: Query length exceeds 500 characters. Truncating...');
			query = query.substring(0, 500);
			// Return a Response with a JSON data field indicating that the query is too long
			const responseData = {
				error: 'Query is too long',
				message: 'The query needs to be lower than 500 characters.',
				truncatedQuery: query,
			};
			return new Response(JSON.stringify(responseData, null, 2), {
				headers: headers,
				status: 400,
			});
		}

		// EMBEDDING MODEL
		// Dimensions: 1024 cosine
		// https://developers.cloudflare.com/workers-ai/models/text-embedding/
		const embeddings = new CloudflareWorkersAIEmbeddings({
			binding: ai, // Using the native Workers AI binding
			modelName: '@cf/baai/bge-m3', // More powerful embedding model with 1024 dimensions
		});

		// VECTORIZE VECTOR STORE
		const dlsVector = env.VECTORIZE_INDEX;
		// Encoding & storing Vectors with enhanced configuration
		const store = new CloudflareVectorizeStore(embeddings, {
			index: dlsVector,
			// Vectorize V2 metadata configuration with proper types and descriptions
			metadata: {
				title: { 
					type: 'string',
					description: 'Title of the content'
				},
				feature: { 
					type: 'string',
					description: 'DLS feature: general, gkm, regional_services, cmb, compliance'
				},
				category: { 
					type: 'string',
					description: 'Content category: overview, technical, compliance, configuration, troubleshooting, legal'
				},
				content_type: { 
					type: 'string',
					description: 'Type of content: overview, technical, compliance, configuration, troubleshooting, legal, faq'
				},
				source: { 
					type: 'string',
					description: 'Source of the content'
				},
				priority: { 
					type: 'integer',
					description: 'Priority level (1-3, where 3 is highest)'
				},
				keywords: { 
					type: 'string',
					description: 'Comma-separated keywords for enhanced search'
				},
				compliance_relevant: { 
					type: 'boolean',
					description: 'Indicates if content is particularly relevant for compliance'
				},
				regions: { 
					type: 'string',
					description: 'Specific regions this content applies to'
				}
			}
		});

		// RETRIEVE VECTOR STORE, INDEX DETAILS
		/* 
		Retrieve the configuration of a given index directly, 
		including its configured `dimensions` and distance `metric`
		*/
		if (url.pathname === '/vector-store') {
			try {
				const details = await dlsVector.describe();
				// let ids = ['1'];
				// const vectors = await dlsVector.getByIds(ids);
				return new Response(JSON.stringify(details, null, 2), {
					headers: {
						'content-type': 'application/json;charset=UTF-8',
					},
				});
			} catch (error) {
				const customErrorMessage = 'ERROR when retrieving Vector Store details';
				console.log(customErrorMessage);
				console.error('ERROR message:', error);
				const customErrorResponse = customErrorMessage + '; ' + error.message;
				return new Response(customErrorResponse, { status: 500, headers: { 'Content-Type': 'text/plain' } });
			}
		}
		// ADD DATA TO VECTORIZE VECTOR STORE
		/* 
		Query D1 database, organize data and
		data to Vector Store in Vectorize
		*/
		else if (url.pathname === '/demo') {
			try {
				// Query D1 Database with enhanced metadata
				const DBquery = `
					SELECT 
						text,
						title,
						feature,
						category,
						content_type,
						source,
						priority,
						keywords,
						compliance_relevant,
						regions
					FROM dls_data_v2
					ORDER BY priority DESC, compliance_relevant DESC;
				`;
				const results = await env.DB.prepare(DBquery).all();
				const transformedArray = [];
				
				// Optimize batch size for V2 (supports larger batches)
				const batchSize = 1000; // V2 supports up to 1000 vectors per batch
				for (let i = 0; i < results.results.length; i++) {
					const json = results.results[i];
					// Enhanced metadata for V2 with richer context
					// Convert SQLite row to proper types for Vectorize
					const transformedObject = {
						pageContent: json.text,
						metadata: {
							title: String(json.title || 'DLS Documentation'),
							feature: String(json.feature || 'general'),
							category: String(json.category || 'general'),
							content_type: String(json.content_type || 'documentation'),
							source: String(json.source || 'DLS Knowledge Base'),
							priority: Number(json.priority || 1),
							keywords: String(json.keywords || ''),
							compliance_relevant: json.compliance_relevant === 1 || json.compliance_relevant === true,
							regions: String(json.regions || 'global')
						},
					};
					transformedArray.push(transformedObject);
					
					// Process in batches
					if (transformedArray.length === batchSize || i === results.results.length - 1) {
						const ids = Array.from({ length: transformedArray.length }, (_, idx) => 
							((Math.floor(i / batchSize) * batchSize) + idx + 1).toString()
						);
						
						// Use upsert for V2 to handle both new and existing vectors
						const mutation = await store.addDocuments(transformedArray, { 
							ids: ids,
							upsert: true // Use upsert instead of insert for V2
						});
						console.log('Batch upserted with mutation ID:', mutation);
						
						// Wait for mutation to be processed
						const indexInfo = await dlsVector.describe();
						console.log('Current index state:', JSON.stringify(indexInfo, null, 2));
						
						transformedArray.length = 0; // Clear the array for next batch
					}
				}
				
				return Response.json({ success: true });
			} catch (error) {
				const customErrorMessage = 'ERROR when querying D1 Database';
				console.log(customErrorMessage);
				console.error('ERROR message:', error);
				const customErrorResponse = customErrorMessage + '; ' + error.message;
				return new Response(customErrorResponse, { status: 500, headers: { 'Content-Type': 'text/plain' } });
			}
		} // DELETE VECTORS
		/* 
		Get the total vectorsCount and delete all vectors,
		essentially starting from scratch
		*/
		else if (url.pathname === '/clear') {
			try {
				const details = await dlsVector.describe();
				const total_num = details.vectorsCount;
				const idsToDelete = [];
				for (let i = 1; i <= total_num; i++) {
					idsToDelete.push(i.toString());
				}
				await store.delete({ ids: idsToDelete });
				return Response.json({ success: true });
			} catch (error) {
				const customErrorMessage = 'ERROR when deleting Knowledge Base, Vectorize Vector Store';
				console.log(customErrorMessage);
				console.error('ERROR message:', error);
				const customErrorResponse = customErrorMessage + '; ' + error.message;
				return new Response(customErrorResponse, { status: 500, headers: { 'Content-Type': 'text/plain' } });
			}
		}
		// VECTOR SEARCH
		/* 
		Searching vector store (knowledge base) for similar documents
		*/
		else if (url.pathname === '/vector-search') {
			// similaritySearch
			// similaritySearchWithScore
			try {
				const searchResults = await store.similaritySearchWithScore(query, 10, {
					returnMetadata: true,
					scoreThreshold: 0.4,
					filter: {
						$and: [
							{
								$or: [
									{ priority: { $gte: 2 } },
									{ compliance_relevant: true },
									{ feature: 'general' }
								]
							},
							{
								$or: [
									{ content_type: 'overview' },
									{ content_type: 'technical' },
									{ content_type: 'configuration' }
								]
							}
						]
					}
				});

				// Advanced post-processing
				const processedResults = searchResults
					.map(([doc, score]) => {
						// Calculate content relevance
						const content = doc.pageContent.toLowerCase();
						const queryTerms = query.toLowerCase().split(/\s+/);
						
						// Term frequency
						const termFrequency = queryTerms.reduce((acc, term) => {
							const matches = content.match(new RegExp(term, 'g'));
							return acc + (matches ? matches.length : 0);
						}, 0) / content.length;
						
						// Metadata scoring
						const metadataScore = doc.metadata.priority ? doc.metadata.priority / 3 : 0.5;
						const complianceBoost = doc.metadata.compliance_relevant ? 0.2 : 0;
						
						// Weighted relevance score
						const relevanceScore = (termFrequency * 0.6) + (metadataScore * 0.3) + complianceBoost;
						
						// Combined scoring
						const combinedScore = (score * 0.7) + (relevanceScore * 0.3);
						
						return {
							content: doc.pageContent,
							score: combinedScore,
							metadata: doc.metadata
						};
					})
					.sort((a, b) => b.score - a.score)
					.slice(0, 5);

				const result = processedResults;
				const similaritySearchResult = JSON.stringify(result, null, 2);
				console.log('similaritySearch', similaritySearchResult);
				// TEST: Return the most similar vector
				return new Response(similaritySearchResult, {
					headers: {
						'content-type': 'application/json;charset=UTF-8',
					},
				});
			} catch (error) {
				const customErrorMessage = 'ERROR when searching Vector Store (Knowledge Base) for similar documents';
				console.log(customErrorMessage);
				console.error('ERROR message:', error);
				const customErrorResponse = customErrorMessage + '; ' + error.message;
				return new Response(customErrorResponse, { status: 500, headers: { 'Content-Type': 'text/plain' } });
			}
		}

		// VECTOR SEARCH
		/* 
		Searching vector store for similar documents
		*/
		// First check if we have data in the vector store
		const details = await dlsVector.describe();
		console.log('Vector store details:', JSON.stringify(details, null, 2));
		
		if (!details.vectorCount) { // Changed from vectorsCount to vectorCount
			console.warn('Vector store is empty. Please add data using the /demo endpoint first.');
			// If no data, return a message suggesting to populate the vector store
			const responseData = {
				error: 'No data in vector store',
				message: 'The vector store is empty. Please add data using the /demo endpoint first.',
				details: details
			};
			return new Response(JSON.stringify(responseData, null, 2), {
				headers: headers,
				status: 400,
			});
		}

		// Generate embedding for the query
		const queryEmbedding = await embeddings.embedQuery(query);
		
		// Search for similar documents with enhanced options and metadata filtering
		const searchResults = await store.similaritySearchWithScore(query, 5, {
			returnMetadata: true,
			scoreThreshold: 0.4, // Base threshold for matches
			filter: {
				$and: [
					{
						$or: [
							{ priority: { $gte: 2 } }, // High or medium priority content
							{ compliance_relevant: true }, // Compliance-relevant content
							{ feature: 'general' } // General overview content
						]
					},
					{
						$or: [
							{ content_type: 'overview' },
							{ content_type: 'technical' },
							{ content_type: 'configuration' }
						]
					}
				]
			},
			topK: 10, // Get more results initially
			minScore: 0.3 // Minimum similarity score to consider
		});
		
		console.log('Search results:', JSON.stringify(searchResults, null, 2));

		// Adding Context with enhanced metadata handling
		let contextMessage;
		if (searchResults && searchResults.length > 0 && searchResults[0].pageContent) {
			// Group results by feature and content type
			const groupedResults = searchResults.reduce((acc, result) => {
				const feature = result.metadata?.feature || 'general';
				const contentType = result.metadata?.content_type || 'documentation';
				if (!acc[feature]) acc[feature] = {};
				if (!acc[feature][contentType]) acc[feature][contentType] = [];
				acc[feature][contentType].push(result);
				return acc;
			}, {});

			// Build context starting with the best match
			contextMessage = searchResults[0].pageContent;
			console.log('Primary context (score: ' + searchResults[0].score + '):', contextMessage);
			
			// Add additional context organized by feature and content type
			if (searchResults.length > 1) {
				const additionalContext = [];
				Object.entries(groupedResults).forEach(([feature, contentTypes]) => {
					Object.entries(contentTypes).forEach(([type, results]) => {
						if (results.length > 0) {
							const relevantResults = results
								.filter(r => r !== searchResults[0]) // Exclude primary context
								.filter(r => r.score >= 0.4); // Only include reasonably good matches
							
							if (relevantResults.length > 0) {
								additionalContext.push(`\n\nRelated ${type} information for ${feature}:\n` + 
									relevantResults.map(r => r.pageContent).join('\n\n'));
							}
						}
					});
				});
				
				if (additionalContext.length > 0) {
					contextMessage += additionalContext.join('');
				}
			}
		} else {
			contextMessage = 'I don\'t have enough context to answer this question accurately. Please refer to the official Cloudflare DLS documentation.';
			console.log('No matching context found for query:', query);
		}
		const systemPrompt = `You are an AI assistant that provides information about Cloudflare's Data Localization Suite (DLS). 

Instructions:
1. ONLY use the provided context to answer questions about DLS
2. If the context doesn't contain relevant information, respond with "I don't have enough context to answer this question accurately. Please refer to the official Cloudflare DLS documentation."
3. Never make assumptions or provide information that isn't explicitly in the context
4. Keep responses clear, factual, and directly related to DLS
5. If asked about technical details, only cite what's in the context
6. Format complex information into bullet points for clarity
7. Limit answers to 250 words and complete sentences

Remember: Accuracy over completeness - it's better to provide less information that is correct than risk providing incorrect information.`;
		// LLM Context and User Query
		const messages = [
			{ role: 'system', content: contextMessage },
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: query },
		];

		// STREAMING RESPONSES
		// https://developers.cloudflare.com/workers-ai/models/text-generation/#using-streaming
		if (url.pathname === '/streaming') {
			const response = await ai.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
				stream: true,
				messages,
				max_tokens: 512,
				temperature: 0.3, // Lower temperature for more factual responses
			});
			// STREAMING RESPONSE
			return new Response(response, {
				headers: {
					'content-type': 'text/event-stream',
				},
			});
		}

		// Run LLM Model
		// https://developers.cloudflare.com/workers-ai/models/text-generation/
		const response = await ai.run('@cf/meta/llama-4-scout-17b-16e-instruct', { 
			messages,
			max_tokens: 512,
			temperature: 0.3, // Lower temperature for more factual responses
			top_p: 0.9 // Slightly reduce randomness while maintaining natural responses
		});
		// FINAL RESPONSE
		return new Response(JSON.stringify(response, null, 2), {
			headers, // CORS Headers
		});
	},
};
