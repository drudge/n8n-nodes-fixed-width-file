import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { EOL } from 'os';
import { debuglog } from 'util';

import { Field, Options, parse, stringify } from '@evologi/fixed-width';
import { getFields } from './GenericFunctions';

const debug = debuglog('n8n-nodes-fixed-width-file');

export class FixedWidthFile implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fixed-Width File',
		name: 'fixedWidthFile',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + ($parameter["fields"] && Array.isArray($parameter["fields"].field) ? "" + $parameter["fields"].field.length + " fields" : "") }}',
		description: 'Fixed Width File',
		defaults: {
			name: 'Fixed Width File',
		},
		icon: 'file:fixed-width-file.svg',
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Read From File',
						value: 'fromFile',
						description: 'Reads data from a fixed width formatted file',
						action: 'Read data from a fixed width formatted file',
					},
					{
						name: 'Write to File',
						value: 'toFile',
						description: 'Writes the workflow data to a fixed width formatted file',
						action: 'Write the workflow data to a fixed width formatted file',
					},
				],
				default: 'fromFile',
			},

			// ----------------------------------
			//         fromFile
			// ----------------------------------
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['fromFile'],
					},
				},
				placeholder: '',
				description:
					'Name of the binary property from which to read the binary data of the fixed width formatted file',
			},

			// ----------------------------------
			//         toFile
			// ----------------------------------
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['toFile'],
					},
				},
				placeholder: '',
				description:
					'Name of the binary property in which to save the binary data of the fixed width formatted file',
			},

			{
				displayName: 'Fields',
				name: 'fields',
				placeholder: 'Add Field',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				description: 'A field in the fixed file format',
				default: {},
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Property Name',
								name: 'property',
								type: 'string',
								default: 'propertyName',
								description:
									'Name of the property to write data to. Supports dot-notation. Example: "data.person[0].name"',
							},
							{
								displayName: 'Type',
								name: 'dataType',
								type: 'options',
								options: [
									{
										name: 'Boolean',
										value: 'boolean',
									},
									{
										name: 'Float',
										value: 'float',
									},
									{
										name: 'Integer',
										value: 'integer',
									},
									{
										name: 'Number',
										value: 'number',
									},
									{
										name: 'String',
										value: 'string',
									},
								],
								default: 'string',
							},
							{
								displayName: 'Width',
								name: 'width',
								type: 'number',
								typeOptions: {
									minValue: 0,
								},
								required: true,
								default: 0,
								description: 'The width of the field in the file',
							},
							{
								displayName: 'Align',
								name: 'align',
								type: 'options',
								options: [
									{
										name: 'Left',
										value: 'left',
									},
									{
										name: 'Right',
										value: 'right',
									},
								],
								displayOptions: {
									show: {
										'/operation': [
											'toFile',
										],
									},
								},
								default: 'left',
							},
						],
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Encoding',
						name: 'encoding',
						type: 'options',
						options: [
							{
								name: 'ASCII',
								value: 'ascii',
							},
							{
								name: 'Base64',
								value: 'base64',
							},
							{
								name: 'Hex',
								value: 'hex',
							},
							{
								name: 'Latin-1 (ISO-8859-1)',
								value: 'latin1',
							},
							{
								name: 'UTF-16 LE',
								value: 'utf16le',
							},
							{
								name: 'UTF-8',
								value: 'utf8',
							},
						],
						displayOptions: {
							show: {
								'/operation': [
									'toFile',
								],
							},
						},
						default: 'utf8',
					},
					{
						displayName: 'End-of-Line Character',
						name: 'eol',
						type: 'string',
						displayOptions: {
							show: {
								'/operation': [
									'toFile',
									'fromFile',
								],
							},
						},
						default: `${EOL}`,
						description: 'The end-of-line character that divides record rows',
					},
					{
						displayName: 'Append End-of-File Character',
						name: 'eof',
						type: 'boolean',
						displayOptions: {
							show: {
								'/operation': [
									'toFile',
								],
							},
						},
						default: true,
						description: 'Whether End Of Line character is added at the end of the file',
					},
					{
						displayName: 'Padding Character',
						name: 'pad',
						type: 'string',
						displayOptions: {
							show: {
								'/operation': [
									'toFile',
								],
							},
						},
						default: ' ',
						description: 'Character to use to pad values shorter than their field\'s width while serializing. It\'s also the trimming value removed while parsing.',
					},
					{
						displayName: 'Trim',
						name: 'trim',
						type: 'options',
						options: [
							{
								name: 'Both',
								value: 'both',
							},
							{
								name: 'None',
								value: 'none',
							},
							{
								name: 'Left',
								value: 'left',
							},
							{
								name: 'Right',
								value: 'right',
							},
						],
						default: 'both',
					},
					{
						displayName: 'Relaxed Parsing',
						name: 'relax',
						type: 'boolean',
						displayOptions: {
							show: {
								'/operation': [
									'fromFile',
								],
							},
						},
						default: false,
						description: 'Whether partial lines are parsed without throwing an error',
					},
					{
						displayName: 'File Name',
						name: 'fileName',
						type: 'string',
						default: '',
						description: 'File name to set in binary data',
						displayOptions: {
							show: {
								'/operation': [
									'toFile',
								],
							},
						},
				},
				],
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let items = this.getInputData();
		let item: INodeExecutionData;
		const operation = this.getNodeParameter('operation', 0) as string;
		const options = this.getNodeParameter('options', 0, {}) as IDataObject;
		let trim: boolean | "left" | "right" = true;
		const pad = options.pad ? options.pad as string : ' ';

		if (options.trim === 'both') {
			trim = true;
		} else if (options.trim === 'none') {
			trim = false;
		} else if (typeof options.trim === 'string' && ['left', 'right'].includes(options.trim as string)) {
			trim = options.trim as ("left" | "right");
		}

		debug("[%s] %j", operation, options);

		if (operation === 'fromFile') {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					item = items[itemIndex];

					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;

					if (item.binary === undefined || item.binary[binaryPropertyName] === undefined) {
						// Property did not get found on item
						continue;
					}

					const fieldsConfig = this.getNodeParameter('fields', itemIndex, {}) as IDataObject;
					const fields: Field[] = getFields(operation, fieldsConfig);
					const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
					const parserOptions = {
						...options,
						trim,
						fields,
					};
					debug("%j", parserOptions);
					const parsedItems = parse(binaryData, parserOptions);
					items = parsedItems.map((json) => ({
						json: json as IDataObject,
						pairedItem: itemIndex,
					}));
				} catch (error) {
					// This node should never fail but we want to showcase how
					// to handle errors.
					if (this.continueOnFail()) {
						items.push({
							json: this.getInputData(itemIndex)[0].json,
							error,
							pairedItem: itemIndex,
						});
					} else {
						// Adding `itemIndex` allows other workflows to handle this error
						if (error.context) {
							// If the error thrown already contains the context property,
							// only append the itemIndex
							error.context.itemIndex = itemIndex;
							throw error;
						}
						throw new NodeOperationError(this.getNode(), error, {
							itemIndex,
						});
					}
				}
			}
		} else if (operation === 'toFile') {
			const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;
			const fieldsConfig = this.getNodeParameter('fields', 0, {}) as IDataObject;
			const fileName = options.fileName as string;
			const encoding = options.encoding as BufferEncoding || 'utf8';
			const fields: Field[] = getFields(operation, fieldsConfig);
			const stringifyOptions: Options = {
				...options,
				encoding,
				pad,
				trim,
				fields,
			};
			try {
				debug("%j", stringifyOptions);
				const text = stringify(items.map(item => item.json), stringifyOptions);
				const binaryData = await this.helpers.prepareBinaryData(Buffer.from(text), fileName);
				items = [
					{
						json: {},
						binary: {
							[binaryPropertyName]: binaryData,
						},
					},
				];
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({
						json: {},
						error,
					});
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error);
				}
			}
		}

		return this.prepareOutputData(items);
	}
}
