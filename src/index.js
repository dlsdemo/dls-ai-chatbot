// npm install langchain
import { CloudflareWorkersAIEmbeddings } from 'langchain/embeddings/cloudflare_workersai';
import { CloudflareVectorizeStore } from 'langchain/vectorstores/cloudflare_vectorize';
// npm install @cloudflare/ai
import { Ai } from '@cloudflare/ai';

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
		const ai = new Ai(env.AI);

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
		// Dimnesions: 768 cosine
		// https://developers.cloudflare.com/vectorize/learning/create-indexes/#dimensions
		const embeddings = new CloudflareWorkersAIEmbeddings({
			binding: env.AI,
			modelName: '@cf/baai/bge-base-en-v1.5',
		});

		// VECTORIZE VECTOR STORE
		// npx wrangler vectorize create vector-dls-index --dimensions=768 --metric=cosine
		const dlsVector = env.VECTORIZE_INDEX;
		// Encoding & storing Vectors
		const store = new CloudflareVectorizeStore(embeddings, {
			index: dlsVector,
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
				// Query D1 Data Localization Suite (DLS) Database
				const DBquery =
					'SELECT * FROM dls_general UNION SELECT * FROM dls_key_management UNION SELECT * FROM dls_regional_services UNION SELECT * FROM dls_customer_metadata_boundary;';
				const results = await env.DB.prepare(DBquery).all();
				const transformedArray = [];
				// Organize data document
				for (let i = 0; i < results.results.length; i++) {
					const json = results.results[i];
					const transformedObject = {
						pageContent: json.text,
						metadata: {}, // empty metadata, for now!
					};
					transformedArray.push(transformedObject);
				}
				const ids = Array.from({ length: transformedArray.length }, (_, i) => (i + 1).toString());
				const json = {
					data: transformedArray,
					ids: ids,
				};
				// Add data to Vectorize Vector Store
				await store.addDocuments(json.data, { ids: json.ids });
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
				const result = await store.similaritySearchWithScore(query, 4); // similaritySearchWithScore, K-Value
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
		const result = await store.similaritySearch(query, 1); // returning the first reponse only
		console.log('similaritySearch', JSON.stringify(result, null, 2));
		// Adding Context
		let contextMessage;
		if (result && result[0] && result[0].pageContent) {
			contextMessage = result[0].pageContent;
			console.log(contextMessage);
		} else {
			// If contextMessage is null or undefined
			contextMessage = 'Could not find any relevant information in the knowledge base. Recommend to review the Cloudflare documentation.';
			console.log('ERROR', contextMessage);
		}
		const systemPrompt = `When answering the question or responding, use the context provided, if it is provided and relevant to the topic of Cloudflare Data Localization Suite (DLS). Limit your answers to maximum 250 words and finished sentences. If you don't know the answer, just say that you don't know, don't try to make up an answer.`;
		// LLM Context and User Query
		const messages = [
			{ role: 'system', content: contextMessage },
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: query },
		];
		// Run LLM Embedding Model
		// https://developers.cloudflare.com/workers-ai/models/text-generation/#available-embedding-models
		const response = await ai.run('@cf/meta/llama-2-7b-chat-fp16', { messages });

		// FINAL RESPONSE
		return new Response(JSON.stringify(response, null, 2), {
			headers, // CORS Headers
		});
	},
};
