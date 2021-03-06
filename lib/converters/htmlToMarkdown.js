var assert = require("assert");
var lists = require('./markdownDefinitions/lists');
var links = require('./markdownDefinitions/links');
var images = require('./markdownDefinitions/images');
var DocumentStream = require("../utils/documentStream");
var formatting = require('./markdownDefinitions/formatting');
var textFormatting = require('./markdownDefinitions/textFormatting');
var blockFormatting = require('./markdownDefinitions/blockFormatting');

var HtmlToMarkdownConverter = module.exports = exports = function(options){
	var self = this;

	self.data = '';
	self.stash = [];
	self.listsFormatting = lists();
	self.linksFormatting = links();
	self.imagesFormatting = images();
	self.initTagConversions();
	self.readableStream = new DocumentStream();
};

HtmlToMarkdownConverter.prototype.done = function(){
	this.data += '\n'+this.linksFormatting.linkReferences();
	this.data += '\n'+this.imagesFormatting.linkReferences();

	this.data = this.data.replace(/\n*$/,'');
	this.readableStream.append(this.data);
	return this.readableStream.done();
};
HtmlToMarkdownConverter.prototype.onTagDepth = function(depth){
	if(depth !== 0)
		return;

	var dataToAppend = this.data.replace(/\n*$/,'');
	this.readableStream.append(dataToAppend);
	this.data = this.data.replace(dataToAppend,'');
};
HtmlToMarkdownConverter.prototype.hasTag = function(htmlTag){
	if(this.tagConversions[htmlTag])
		return true;

	return false;
};

HtmlToMarkdownConverter.prototype.stashSaveData = function(){
	this.stash.push(this.data);
	this.data = '';
};

HtmlToMarkdownConverter.prototype.stashPopData = function(dataToAppend){
	this.data = this.stash.pop();
	this.appendTextData(dataToAppend);
};

HtmlToMarkdownConverter.prototype.appendTextData = function(textData){
	if(textData)
		this.data += textData;
};

HtmlToMarkdownConverter.prototype.convertOpenTag = function(htmlTag,convertOptions) {
	var tagConversion = this.tagConversions[htmlTag];
	if(!tagConversion)
		return;
	
	if(tagConversion.open)
		this.appendTextData(tagConversion.open(convertOptions));

	if(tagConversion.text)
		this.stashSaveData();
};

HtmlToMarkdownConverter.prototype.convertCloseTag = function(htmlTag,convertOptions) {
	var tagConversion = this.tagConversions[htmlTag];
	if(!tagConversion)
		return;

	if(tagConversion.text)
		this.stashPopData(tagConversion.text(this.data));

	if(tagConversion.close)
		this.appendTextData(tagConversion.close());
};

HtmlToMarkdownConverter.prototype.initTagConversions = function() {
	var self = this;
	self.tagConversions = {};

	self.tagConversions['H1'] = { text: function(textData){return textFormatting.header(textData,1);}};
	self.tagConversions['H2'] = { text: function(textData){return textFormatting.header(textData,2);}};
	self.tagConversions['H3'] = { text: function(textData){return textFormatting.header(textData,3);}};
	self.tagConversions['H4'] = { text: function(textData){return textFormatting.header(textData,4);}};
	self.tagConversions['H5'] = { text: function(textData){return textFormatting.header(textData,5);}};
	self.tagConversions['H6'] = { text: function(textData){return textFormatting.header(textData,6);}};

	self.tagConversions['BR'] = { open: function(){ return formatting.lineBreak();}};
	self.tagConversions['HR'] = { open: function(){ return formatting.headerMarker();}};
	
	self.tagConversions['CITE'] = { text: function(textData){ return textFormatting.emphasis(textData);}};
	self.tagConversions['DFN'] = { text: function(textData){ return textFormatting.emphasis(textData);}};
	self.tagConversions['EM'] = { text: function(textData){ return textFormatting.emphasis(textData);}};
	self.tagConversions['I'] = { text: function(textData){ return textFormatting.emphasis(textData);}};
	self.tagConversions['U'] = { text: function(textData){ return textFormatting.emphasis(textData);}};
	self.tagConversions['VAR'] = { text: function(textData){ return textFormatting.emphasis(textData);}};
	self.tagConversions['B'] = { text: function(textData){ return textFormatting.bold(textData);}};
	self.tagConversions['STRONG'] = { text: function(textData){ return textFormatting.bold(textData);}};
	self.tagConversions['Q'] = { text: function(textData){ return textFormatting.quote(textData);}};

	self.tagConversions['PRE'] = { text: function(textData){ return blockFormatting.prefixWithBlockCode(textData);}};
	self.tagConversions['CODE'] = {	text: function(textData){ return textFormatting.code(textData);}};
	self.tagConversions['KBD'] = { text: function(textData){ return textFormatting.code(textData);}};
	self.tagConversions['SAMP'] = { text: function(textData){ return textFormatting.code(textData);}};
	self.tagConversions['BLOCKQUOTE'] = { text: function(textData){ return blockFormatting.prefixWithBlockQuote(textData);}};
	self.tagConversions['DD'] = { text: function(textData){ return blockFormatting.prefixWithBlockQuote(textData);}};
	self.tagConversions['P'] = { open: function(){ return formatting.paragraph();}};

	self.tagConversions['LI'] = { text: function(textData){ return self.listsFormatting.listItem(textData);}};
	self.tagConversions['OL'] = {
					open: function(){ return self.listsFormatting.orderedList();},
					close : function(){ return self.listsFormatting.listClose();}
				};
	self.tagConversions['UL'] = {
					open: function(){ return self.listsFormatting.unOrderedList();},
					close : function(){ return self.listsFormatting.listClose();}
				};

	self.tagConversions['A'] = {
					open :function(linkDefinition){ self.linksFormatting.currentLinkDefinition = linkDefinition;},
					text: function(text){ return self.linksFormatting.link(text);}
				};
	self.tagConversions['IMG'] = { 
					open :function(imageDefinition){ self.imagesFormatting.currentImageDefinition = imageDefinition;},
					text: function(){ return self.imagesFormatting.image();}
				};
};