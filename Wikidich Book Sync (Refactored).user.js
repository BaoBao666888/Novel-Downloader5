// ==UserScript==
// @name         Wikidich Book Sync (Refactored)
// @namespace    https://github.com/BaoBao666888/
// @version      3.0.0
// @description  Syncs Wikidich chapters with a source (e.g., Fanqie) directly from the book page, handles hidden content.
// @icon         data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAFgAAACgAAABAAAAAgAAAAAEAIAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAADaxiYA2sYmAdrGJnPaxibZ2sYm+9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibf2sYmgNrGJgbaxiYA2sYmAtrGJpzaxib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiaw2sYmCNrGJm3axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJn/axibd2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibl2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cUg/9jDG//Ywxr/2MMZ/9jDGf/Ywxr/2cQd/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSL/2cQd/9jDGv/Ywxn/2MMZ/9jDGf/Ywxv/2cQe/9rFI//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUi/9jDGv/Ywxr/28cp/+DORf/l12X/6dx6/+vgh//r4If/6Nt1/+PTVv/dyjT/2cQe/9jDGf/ZxB//2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cQd/9jDGf/ZxSD/3cs3/+PUWv/o3Hf/6+CH/+vgh//q3oH/5tls/+HRT//cyC7/2cQc/9jDGf/ZxSD/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/2MMa/93LN//n2nL/8eqt//n23P/+/vr//////////////////////////////////Prs//Xvw//r4In/4M9G/9nEHf/ZxB3/2sYm/9rGJP/Ywxr/2sYm/+LTVf/t45L/9vHI//377v//////////////////////////////////////+/jk//PtuP/p3n//381B/9nEHP/ZxB7/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/Ywxj/3sw7/+/moP/9++7///////////////////////////////////////////////////////////////////////7++f/z7bf/4dFN/9jCF//axiX/6d16//j01f////////////////////////////////////////////////////////////////////////////799f/y67L/4M9I/9jDGP/axiT/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nFIf/ZxR//6d19//z77P/////////////////////////////////////////////////////////////////////////////////////////////++//w56T/9/LN//////////////////////////////////////////////////////////////////////////////////////////////////799v/s4Yr/2sYj/9nEH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEH//byCz/8+yz//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Xww//dyzj/2cQc/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEHv/cyS//9/LN//////////////////////////////////////////////////389P/7+OT/+PXX//n12P/8+un////9///////////////////////////////////////////////////////////////////////////////9//z66//59tz/+PTV//r33//8++7/////////////////////////////////////////////////+vji/+HQSf/Zwxv/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nFIP/cyS//9/LN///////////////////////////////////////59tv/7eOS/+PUWv/ezDv/3Mgt/9rGJf/axib/3Mkx/+DQSf/p3Xr/9vHI//////////////////////////////////////////////////799f/z7LX/6Ntz/+DQSf/cyTL/28co/9rGJP/bxyr/3co1/+LSUP/r34X/9/PQ///////////////////////////////////////7+ej/385C/9nEHf/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/ZxR//9O68//////////////////////////////////r44v/o23X/28co/9jCGP/ZxBz/2cUh/9rGI//axiX/2sYk/9rFI//ZxB//2MMY/9nFIP/k1V//9vLL/////////////////////////////v76/+/mnv/fzT//2MMb/9jDGf/ZxB//2sUj/9rGJP/axiX/2sYk/9rFIv/ZxB7/2MMY/9rFIv/l1mP/+fXX//////////////////////////////////n12P/byCv/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/6t6B//////////////////////////////////Pstv/cyjL/2MMX/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMa/9rFIv/r4Ib//fvv////////////+fXY/+LSUf/Ywxf/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMZ/9vIKf/w6KX/////////////////////////////////8emr/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/380///788/////////////////////////////Hpqf/ZxB7/2cUg/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSH/2MMX//bwxf//////9e/A/9zJLf/Zwxv/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/2MMa/+zhiv/////////////////////////////////m2Gf/2cQa/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMa//Hpqf////////////////////////////PstP/ZxB7/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMZ/+3jkv//////9fDE/9rGJv/ZxR//2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/Ywxf/7uSW////////////////////////////+vfh/9vIKv/axiP/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUh/97MO//+/fX///////////////////////r44f/cyS7/2cUg/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+PTVf////7/+/jj/93KMv/ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYj/9nFHv/178H////////////////////////////p3Xv/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDGv/o3Hf////////////////////////////n2m//2MMY/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYl/9rFIv/388///////+TWYP/Ywxn/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/381A//388///////////////////////+PTS/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/8+y2///////////////////////59tv/2sYm/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSP/2cUh/9rFIv/axiX/2sYm/9nEG//m12b///////Pstf/Ywxr/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUj/9nFIf/ZxSL/2sYl/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDF//u5Zr//////////////////////////P/gz0j/2cUf/9rGJv/axib/2sYm/9rGJv/axiT/3Mgs//v45P//////////////////////7eKR/9jDGP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFI//Ywxv/3Mkv/97MPv/dyzf/2cQf/9nEHv/ZxB3/9e/C///////h0U7/2cQd/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiP/2MMa/9zILv/ezD7/3cs4/9nEH//ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/381A//799v//////////////////////6d5+/9jDGf/axib/2sYm/9rGJv/axib/2cQe/+HRTv////7//////////////////////+LSU//ZxB3/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFIv/bxyj/7uSW//v45P/+/fb//fvv//Tuu//fzkL/3co0///++//38sv/2cQe/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/28cn/+3jlP/7+OP//v32//378P/07r3/4dBK/9nEHP/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/28MX///////////////////////Lrs//ZxBv/2sYm/9rGJv/axib/2sYm/9jDGv/o23b///////////////////////z67P/cyjL/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSD/8+23////////////////////////////+/nl/+3jk///////6t5+/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2cUg//PstP////////////////////////////377//gz0X/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/7eKP///////////////////////59tz/28cn/9rGJP/axib/2sYm/9rGJv/Ywxn/7uSZ///////////////////////489D/2sUi/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/5tlr///////////////////////////////////////////////8/+HQSf/ZxR//2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+bYaP//////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYaf///////////////////////fzz/97MOv/axSH/2sYm/9rGJv/axib/2MMb//LqsP//////////////////////9O26/9jDHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe//XwxP////////////////////////////////////////////v55v/cyC3/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/177/////////////////////////////////////////+/P/gz0f/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i01T///////////////////////7++//fzkT/2cUg/9rGJv/axib/2sYm/9nEHf/07r////////////////////////Dopv/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUi/93LNv/9/PH////////////////////////////////////////////38s3/2sUh/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rFIv/dyjT//fvu////////////////////////////////////////////6dx5/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56H/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lD/////////////////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4dFO/////////////////////////////////////////////////+/mnf/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBz/5ddl//////////////////////////////////////////////////Ptuf/ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+XWY//////////////////////////////////////////////////z7LX/2cQb/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bZa//////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//n2Gn/////////////////////////////////////////////////9e68/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGP/axiX/2sYl/9rGJf/axiX/2sYl/9rGJf/Ywxr/5thq//////////////////////////////////////////////////Ptuf/YxBv/2sYl/9rGJf/axiX/2sYl/9rGJf/axiX/2MMa/+bXaP/////////////////////////////////////////////////07bv/2cQb/9rGJf/axiX/2sYl/9rGJf/axiX/2sYl/9nEHf/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/078D//////////////////////+/mn//XwRL/2cQf/9nEH//ZxB//2cQf/9nEH//ZxB//18EU/+XXZv/////////////////////////////////////////////////z7bf/18IV/9nEH//ZxB//2cQf/9nEH//ZxB//2cQf/9fBFP/l1mP/////////////////////////////////////////////////9O25/9jCFf/ZxB//2cQf/9nEH//ZxB//2cQf/9nEH//Ywhf/4dFO///////////////////////+/vv/385E/9nFIP/axib/2sYm/9rGJv/ZxBz/8+25///////////////////////7+ej/9fDE//bxyP/28cj/9vHI//bxyP/28cj/9vHI//Xwxf/59dn//////////////////////////////////////////////////Pvt//Xwxf/28cj/9vHI//bxyP/28cj/9vHI//bxyP/18MX/+fXZ//////////////////////////////////////////////////z77v/28MX/9vHI//bxyP/28cj/9vHI//bxyP/28cj/9vDG//j00////////////////////////v73/9/NP//ZxSH/2sYm/9rGJv/axib/2MMZ/+zijf/////////////////////////////////////////////////////////////////////////////////////////////////+/ff//////////////////////////////////////////////////////////////////////////////////////////////////v33//////////////////////////////////////////////////////////////////////////////////////////////////n22//bxib/2sYk/9rGJv/axib/2sYm/9nEHv/i0U/////+////////////////////////////////////////////////////////////////////////////////////////////7eOT//z66////////////////////////////////////////////////////////////////////////////////////////////+7klv/7+eb////////////////////////////////////////////////////////////////////////////////////////////v5pz/2MMa/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+3klf//////////////////////////////////////////////////////////////////////////////////////9fDD/9jDGf/p3Xz///////////////////////////////////////////////////////////////////////////////////////bxyP/ZxBv/6Nt1///////////////////////////////////////////////////////////////////////////////////////59tr/3Mkv/9rFIv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/axSH/6+CJ//378P///////////////////////////////////////////////////////////////////vz/8uqu/9zILv/ZxSD/2cQd/+ncef/8+uz////////////////////////////////////////////////////////////////////9//Lqr//cyS//2cUg/9nEHf/o3Hj//Prr/////////////////////////////////////////////////////////////////////v/07rv/3sw5/9nEHv/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYk/9jDG//ezDv/5thp/+3jkv/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kl//o3Hj/4M9I/9nEH//axSH/2sYn/9rGJf/Ywxv/3cs3/+XXZ//t45H/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jf/6dx6/+DQSv/ZxB//2cUh/9rGJ//axiX/2MMb/93LNv/l12X/7eKQ/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+ndfP/h0Ez/2sUi/9nFH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUh/9jDG//Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMa/9nEH//axiX/2sYm/9rGJv/axib/2sYm/9rFIv/Ywxv/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGv/ZxB//2sYl/9rGJv/axib/2sYm/9rGJv/axSL/2cQc/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxr/2cQf/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axibW2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibf2sYmX9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmcdrGJgDaxiaH2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmnNrGJgPaxiYA2sYmANrGJmHaxibR2sYm+trGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibX2sYmb9rGJgDaxiYAgAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAwAAAAAAAAAM=
// @match        https://truyenwikidich.net/truyen/*
// @match        https://truyenwikidich.net/truyen/*/*/chinh-sua
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @connect      *
// @run-at       document-idle
// ==/UserScript==

(async function () {
    'use strict';

    // --- Constants ---
    const DEBUG = true;
    const SCRIPT_ID = 'WikidichBookSync';
    const FANQIE_API_DEFAULT = 'https://rehaofan.jingluo.love'; // Default, can be overridden by tokenOptions
    const NEXT_CHAPTER_DELAY = 2000; // ms delay before processing next chapter
    const TAB_CLOSE_DELAY_OK = 1000; // ms delay before closing OK/Checked tabs
    const TAB_CLOSE_DELAY_SUBMIT = 2000; // ms delay before closing submitted edit tabs (allow page reload)
    const TAB_CLOSE_DELAY_ERROR = 3000; // ms delay for error tabs
    const EDIT_PAGE_TIMEOUT = 60000; // ms timeout waiting for edit page to report back
    const MAX_CHAPTERS_TO_DISPLAY = 1000; // Limit displayed chapters in UI for performance

    // Storage Prefixes
    const STORAGE_PREFIX = `${SCRIPT_ID}_`;
    const WIKI_LIST_PREFIX = `${STORAGE_PREFIX}wiki_list_`;
    const SOURCE_LIST_PREFIX = `${STORAGE_PREFIX}source_list_`;
    const PROCESS_STATUS_PREFIX = `${STORAGE_PREFIX}process_status_`;
    const SOURCE_URL_PREFIX = `${STORAGE_PREFIX}source_url_`;
    const CURRENT_ADAPTER_PREFIX = `${STORAGE_PREFIX}adapter_`;
    const IS_RUNNING_PREFIX = `${STORAGE_PREFIX}running_`;
    const EDIT_TAB_STATUS_PREFIX = `${STORAGE_PREFIX}edit_status_`; // Key for edit tabs to report back

    // UI IDs
    const UI_PANEL_ID = `${SCRIPT_ID}-panel`;
    const UI_TOGGLE_ID = `${SCRIPT_ID}-toggle`;
    const UI_STATUS_ID = `${SCRIPT_ID}-status`;
    const UI_WIKI_LIST_ID = `${SCRIPT_ID}-wiki-list`;
    const UI_SOURCE_LIST_ID = `${SCRIPT_ID}-source-list`;
    const UI_SOURCE_URL_INPUT_ID = `${SCRIPT_ID}-source-url`;
    const UI_FETCH_SOURCE_BTN_ID = `${SCRIPT_ID}-fetch-source`;
    const UI_FETCH_WIKI_BTN_ID = `${SCRIPT_ID}-fetch-wiki`;
    const UI_RANGE_INPUT_ID = `${SCRIPT_ID}-range`;
    const UI_START_BTN_ID = `${SCRIPT_ID}-start`;
    const UI_STOP_BTN_ID = `${SCRIPT_ID}-stop`;
    const UI_CLEAR_HISTORY_BTN_ID = `${SCRIPT_ID}-clear`;
    const UI_CLOSE_BTN_ID = `${SCRIPT_ID}-close`;

    // --- Globals ---
    let FANQIE_API = FANQIE_API_DEFAULT;
    let currentBookInfo = null; // { id: string, title: string, key: string (for storage) }
    let wikiChapters = []; // Array: { number: int, name: string, url: string, host: string }
    let sourceChapters = []; // Array: { number: int, name: string, url: string, id: string } (adapter specific)
    let chapterStatus = {}; // { chapterNumber: 'pending' | 'checked_ok' | 'updated_hidden' | 'error' | 'processing' | 'skipped' | 'submit_triggered' }
    let currentAdapter = null; // The detected API adapter
    let isSyncRunning = false;
    let syncQueue = []; // Array of chapter numbers to process
    let currentChapterProcessing = null; // Chapter number currently being processed
    let editPageTimeoutId = null; // Timeout ID for waiting on edit page
    let statusListenerId = null; // GM_addValueChangeListener ID

    // --- API Adapters ---
    const apiAdapters = {
        fanqie:
        {
            detect: (url) => /fanqienovel\.com\/(page|reader)\/\d+/.test(url),
            extractBookId: (url) => url.match(/fanqienovel\.com\/(?:page|reader)\/(\d+)/)?.[1],
            fetchDirectory: fetchFanqieDirectory,
            fetchContent: getChapterContentFromFanqie,
            name: "Fanqie Novel",
            requiresApi: true
        },
        // Add other adapters here if needed
    };

    // --- Utility Functions ---
    function logDebug(...args) {
        if (DEBUG) console.log(`[${SCRIPT_ID}] ${getTimestamp()}:`, ...args);
    }

    function getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    function getStorageKey(prefix, bookKey) {
        if (!bookKey) {
            console.error("Cannot get storage key without bookKey");
            return null;
        }
        // Sanitize bookKey slightly for use in GM keys if needed, though usually not necessary
        const cleanKey = bookKey.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `${prefix}${cleanKey}`;
    }

    async function saveToStorage(key, value) {
        if (!key) return;
        try {
            await GM_setValue(key, JSON.stringify(value));
            logDebug(`Saved to storage key: ${key}`);
        } catch (e) {
            console.error(`Error saving to storage key ${key}:`, e);
            logToStatusUI(`Lỗi lưu trữ: ${key}`, true);
        }
    }

    async function loadFromStorage(key, defaultValue = null) {
        if (!key) return defaultValue;
        const jsonValue = await GM_getValue(key, null);
        logDebug(`Value received from GM_getValue for key '${key}':`, (jsonValue === null ? 'null' : `Type: ${typeof jsonValue}, Length: ${jsonValue?.length}`)); // Log giá trị thô nhận được
        if (jsonValue === null) {
            logDebug(`Key '${key}' not found in storage or GM_getValue returned null.`);
            return defaultValue;
        }
        try {
             const parsedValue = JSON.parse(jsonValue);
            logDebug(`Successfully parsed JSON for key '${key}'`);
            return parsedValue;
        } catch (e) {
             console.error(`[${SCRIPT_ID}] ERROR parsing JSON for key '${key}':`, e, "Raw JSON:", jsonValue);
            await GM_deleteValue(key); // Xóa dữ liệu lỗi
            return defaultValue;
        }
    }

    function parseRange(rangeStr) {
        if (!rangeStr) return null;
        const [startStr, endStr] = rangeStr.trim().split('-');
        const start = parseInt(startStr);
        // Handle cases like "5-" (meaning 5 to end)
        const end = (endStr && !isNaN(parseInt(endStr))) ? parseInt(endStr) : Infinity;
        return isNaN(start) ? null : { start, end };
    }

    async function initializeApiEndpoint() {
        // Reuse tokenOptions if available globally (like in original script)
        const options = await getTokenOptionsWithRetry();
        if (options && options.Fanqie) {
            FANQIE_API = options.Fanqie;
            logDebug(`Using Fanqie API from tokenOptions: ${FANQIE_API}`);
        } else {
            logDebug(`Using default Fanqie API: ${FANQIE_API}`);
        }
    }

    async function getTokenOptionsWithRetry(timeoutMs = 3000, intervalMs = 200) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            if (typeof unsafeWindow !== 'undefined' && unsafeWindow.tokenOptions) {
                return unsafeWindow.tokenOptions;
            }
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        logDebug(`Timeout waiting for unsafeWindow.tokenOptions after ${timeoutMs}ms.`);
        return null;
     }

    // --- Wikidich Chapter Fetching ---
    const WikiChapterFetcher = {
        signFunc: `function signFunc(r){function o(r,o){return r>>>o|r<<32-o}for(var f,n,t=Math.pow,c=t(2,32),i="length",a="",e=[],u=8*r[i],v=[],g=[],h=g[i],l={},s=2;64>h;s++)if(!l[s]){for(f=0;313>f;f+=s)l[f]=s;v[h]=t(s,.5)*c|0,g[h++]=t(s,1/3)*c|0}for(r+="\u0080";r[i]%64-56;)r+="\0";for(f=0;f<r[i];f++){if((n=r.charCodeAt(f))>>8)return;e[f>>2]|=n<<(3-f)%4*8}for(e[e[i]]=u/c|0,e[e[i]]=u,n=0;n<e[i];){var d=e.slice(n,n+=16),p=v;for(v=v.slice(0,8),f=0;64>f;f++){var w=d[f-15],A=d[f-2],C=v[0],F=v[4],M=v[7]+(o(F,6)^o(F,11)^o(F,25))+(F&v[5]^~F&v[6])+g[f]+(d[f]=16>f?d[f]:d[f-16]+(o(w,7)^o(w,18)^w>>>3)+d[f-7]+(o(A,17)^o(A,19)^A>>>10)|0);(v=[M+((o(C,2)^o(C,13)^o(C,22))+(C&v[1]^C&v[2]^v[1]&v[2]))|0].concat(v))[4]=v[4]+M|0}for(f=0;8>f;f++)v[f]=v[f]+p[f]|0}for(f=0;8>f;f++)for(n=3;n+1;n--){var S=v[f]>>8*n&255;a+=(16>S?0:"")+S.toString(16)}return a}`,

        Script: {
            execute: (fnStr, fnName, arg) => {
                const fn = new Function(fnStr + `; return ${fnName};`)();
                return fn(arg);
            }
        },

        Http: {
            get: (url) => ({
                html: () => new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url,
                        onload: (res) => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(res.responseText, "text/html");
                            doc.html = () => res.responseText;
                            resolve(doc);
                        },
                        onerror: reject,
                    });
                })
            })
        },

        Response: {
            success: (data) => data
        },

        getAllChapters: async function (url) {
            const BASE_URL = 'https://truyenwikidich.net';
            url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

            let doc = await this.Http.get(url).html();
            const bookId = doc.querySelector("input#bookId")?.value;
            const html = doc.html();
            const size = html.match(/loadBookIndex.*?,\s*(\d+)/)?.[1] || 50;
            const signKey = html.match(/signKey\s*=\s*"(.*?)"/)?.[1];
            const fuzzySign = html.match(/function fuzzySign[\s\S]*?}/)?.[0];

            if (!bookId || !signKey || !fuzzySign) {
                throw new Error("Thiếu dữ liệu cần thiết để tải chương.");
            }

            const genSign = (signKey, currentPage, size) => {
                return this.Script.execute(this.signFunc, "signFunc",
                                           this.Script.execute(fuzzySign, "fuzzySign", signKey + currentPage + size)
                                          );
            };

            const getChapterInPage = async (currentPage) => {
                const params = new URLSearchParams({
                    bookId: bookId,
                    signKey: signKey,
                    sign: genSign(signKey, currentPage, size),
                    size: size,
                    start: currentPage.toFixed(0)
                });
                return await this.Http.get(`${BASE_URL}/book/index?${params}`).html();
            };

            let currentPage = 0;
            const data = [];
            doc = await getChapterInPage(currentPage);

            while (doc) {
                const els = doc.querySelectorAll("li.chapter-name a, ul#chapters li a, a[href*='/chuong-']");
                for (const e of els) {
                    let link = e.getAttribute("href") || e.getAttribute("data-href");
                    if (link?.length >= 2) {
                        const name = e.textContent.trim();
                        let number = null;
                        // Trích xuất số chương từ tên hoặc link
                        const nameMatch = name.match(/(?:Chương|第)\s*(\d+)/i);
                        const urlMatch = link.match(/\/chuong-(\d+)/i);
                        if (nameMatch?.[1]) {
                            number = parseInt(nameMatch[1]);
                        } else if (urlMatch?.[1]) {
                            number = parseInt(urlMatch[1]);
                        }

                        // Chỉ thêm vào nếu trích xuất được số chương
                        if (number !== null) {
                            // Đảm bảo URL là tuyệt đối
                            const absoluteUrl = link.startsWith('http') ? link : (link.startsWith('/') ? `${BASE_URL}${link}` : `${BASE_URL}/${link}`);
                            data.push({
                                number: number, // <-- Thêm dòng này
                                name: name,
                                url: absoluteUrl, // Sử dụng URL tuyệt đối
                                host: BASE_URL
                            });
                        } else {
                            logDebug(`Could not parse chapter number for: ${name} (${link})`); // Log nếu không parse được số
                        }
                    }
                }

                const paginationLinks = doc.querySelectorAll("ul.pagination a[data-start]");
                const lastPage = paginationLinks.length > 0
                ? parseInt(paginationLinks[paginationLinks.length - 1].getAttribute("data-start"))
                : 0;

                if (currentPage >= lastPage) break;
                currentPage += parseInt(size);
                doc = await getChapterInPage(currentPage);
            }

            return this.Response.success(data);
        }
    };
    // --- Source Fetching Functions ---
    async function fetchFanqieDirectory(bookId, callback) {
        logToStatusUI('Đang tải danh sách chương Fanqie...');
        const directoryUrl = `https://fanqienovel.com/page/${bookId}`;
        logDebug(`Fetching Fanqie directory: ${directoryUrl}`);
        try {
            const doc = await WikiChapterFetcher.Http.get(directoryUrl).html(); // Reuse Http helper
            const chapterEls = doc.querySelectorAll('.page-directory-content .chapter-item a.chapter-item-title');
            if (!chapterEls || chapterEls.length === 0) {
                 logToStatusUI('❌ Không tìm thấy chương nào trên Fanqie.', true);
                 callback(null);
                 return;
            }
            const chapters = Array.from(chapterEls).map(el => {
                const name = el.innerText?.trim();
                const href = el.getAttribute('href');
                const url = href ? new URL(href, 'https://fanqienovel.com/').href : null;
                const numberMatch = name?.match(/第\s*(\d+)\s*章/);
                const idMatch = href?.match(/reader\/(\d+)/);
                return {
                    number: numberMatch ? parseInt(numberMatch[1]) : null,
                    name: name || 'N/A',
                    url: url,
                    id: idMatch ? idMatch[1] : null
                };
            }).filter(c => c.number !== null && c.id && c.url); // Ensure crucial data exists

             if (chapters.length === 0) {
                 logToStatusUI('⚠️ Không parse được chương Fanqie hợp lệ nào (thiếu số chương hoặc ID).', true);
                 callback(null); return;
             }
             // Sort by number
             chapters.sort((a, b) => a.number - b.number);
            logToStatusUI(`✅ Tải xong ${chapters.length} chương Fanqie.`);
            callback(chapters);
        } catch (error) {
            logDebug("Error fetching Fanqie directory:", error);
            logToStatusUI(`❌ Lỗi tải DS Fanqie: ${error.message}`, true);
            callback(null);
        }
    }

    async function getChapterContentFromFanqie(chapterId, callback) {
        const apiUrl = `${FANQIE_API}/content?item_id=${chapterId}`;
        logDebug(`Fetching Fanqie content for ID ${chapterId} from ${apiUrl}`);

        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            responseType: 'json',
            timeout: 20000,
            onload: res => {
                if (res.status >= 200 && res.status < 300) {
                    try {
                        let contentData = res.response;
                        let content = contentData?.data?.content ?? contentData?.data?.data?.content ?? contentData?.content;

                        if (typeof content === 'string') {
                            content = content.trim();
                            if (content.length === 0) {
                                logDebug(`API returned empty content string for ID ${chapterId}.`);
                                callback(null);
                                return;
                            }

                            const textOnly = extractTextOnly(content);
                            logDebug(`Successfully extracted plain text for Fanqie ID ${chapterId}. Length: ${textOnly.length}`);
                            callback(textOnly);
                        } else {
                            logDebug(`API returned invalid content type for ID ${chapterId}. Response:`, res.response);
                            callback(null);
                        }
                    } catch (e) {
                        logDebug(`Error processing JSON/content for Fanqie ID ${chapterId}:`, e, res.responseText);
                        callback(null);
                    }
                } else {
                    logDebug(`Fanqie content API HTTP Error ${res.status} for ID ${chapterId}. Response:`, res.responseText);
                    callback(null);
                }
            },
            onerror: error => {
                logDebug(`Network/API error fetching Fanqie content ID ${chapterId}:`, error);
                callback(null);
            },
            ontimeout: () => {
                logDebug(`Timeout fetching Fanqie content ID ${chapterId}.`);
                callback(null);
            }
        });
    }


    function extractTextOnly(html) {
        // Giải mã các ký tự escape từ Fanqie
        const decoded = html
        .replace(/\\u003C/g, '<')
        .replace(/\\u003E/g, '>')
        .replace(/\\u0026/g, '&')
        .replace(/\\"/g, '"');

        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(decoded, 'text/html');

        // Lấy toàn bộ textContent theo đúng thứ tự DOM
        let walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
        let textSegments = [];

        while (walker.nextNode()) {
            let text = walker.currentNode.nodeValue.trim();
            if (text) {
                textSegments.push(text);
            } else if (
                textSegments.length > 0 &&
                textSegments[textSegments.length - 1] !== ''
            ) {
                // Thêm dòng trống giữa các đoạn để xuống dòng
                textSegments.push('');
            }
        }

        // Gộp lại thành một đoạn văn bản hoàn chỉnh, xuống dòng giữa đoạn
        return textSegments.join('\n');
    }

    // --- UI Functions ---
    function addStyles() {
        GM_addStyle(`
            #${UI_PANEL_ID} {
                position: fixed; bottom: 10px; right: 10px; width: 550px; max-height: 60vh; background: #f9f9f9;
                border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 9999; display: none; flex-direction: column; font-family: sans-serif; font-size: 13px; color: #333;
            }
            #${UI_PANEL_ID} .panel-header {
                display: flex; justify-content: space-between; align-items: center; padding: 8px 12px;
                background: #eee; border-bottom: 1px solid #ccc; border-radius: 8px 8px 0 0;
            }
            #${UI_PANEL_ID} .panel-header h4 { margin: 0; font-size: 16px; color: #1a73e8; font-weight: 600; }
            #${UI_PANEL_ID} .panel-controls { display: flex; gap: 5px; }
            #${UI_PANEL_ID} .panel-body { padding: 10px; overflow: hidden; display: flex; flex-direction: column; flex-grow: 1; }
            #${UI_PANEL_ID} .list-section { display: flex; flex-grow: 1; gap: 10px; margin-top: 10px; overflow: hidden; }
            #${UI_PANEL_ID} .chapter-list-container { flex: 1; display: flex; flex-direction: column; border: 1px solid #ddd; background: #fff; border-radius: 4px; overflow: hidden;}
            #${UI_PANEL_ID} .list-header { padding: 5px 8px; background: #f5f5f5; font-weight: bold; border-bottom: 1px solid #ddd; white-space: nowrap; }
            #${UI_PANEL_ID} .chapter-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex-grow: 1; }
            #${UI_PANEL_ID} .chapter-list li { padding: 4px 8px; border-bottom: 1px solid #eee; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: default; }
            #${UI_PANEL_ID} .chapter-list li:last-child { border-bottom: none; }
            #${UI_PANEL_ID} .chapter-list li span.ch-num { display: inline-block; width: 35px; color: #666; margin-right: 5px; text-align: right;}
            #${UI_PANEL_ID} .chapter-list li span.ch-name {}
            #${UI_PANEL_ID} .chapter-list li.status-pending { /* Default */ }
            #${UI_PANEL_ID} .chapter-list li.status-processing { background-color: #fffde7; font-weight: bold; }
            #${UI_PANEL_ID} .chapter-list li.status-checked_ok { color: #757575; } /* Gray out */
            #${UI_PANEL_ID} .chapter-list li.status-submit_triggered { background-color: #e1f5fe; } /* Light blue for submit */
            #${UI_PANEL_ID} .chapter-list li.status-updated_hidden { background-color: #c8e6c9; } /* Green */
            #${UI_PANEL_ID} .chapter-list li.status-error { background-color: #ffcdd2; color: #b71c1c; } /* Red */
            #${UI_PANEL_ID} .chapter-list li.status-skipped { color: #bdbdbd; font-style: italic; }
            #${UI_PANEL_ID} .config-section { display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: center; margin-bottom: 10px; }
            #${UI_PANEL_ID} label { font-weight: 500; }
            #${UI_PANEL_ID} input[type="url"], #${UI_PANEL_ID} input[type="text"] {
                padding: 5px 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box;
            }
            #${UI_PANEL_ID} .action-buttons { display: flex; gap: 8px; margin-top: 10px; }
            #${UI_PANEL_ID} button {
                padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;
                background-color: #e0e0e0; color: #333; transition: background-color 0.2s;
            }
            #${UI_PANEL_ID} button:hover:not(:disabled) { background-color: #d5d5d5; }
            #${UI_PANEL_ID} button:disabled { cursor: not-allowed; opacity: 0.6; }
            #${UI_PANEL_ID} button.primary { background-color: #1a73e8; color: white; }
            #${UI_PANEL_ID} button.primary:hover:not(:disabled) { background-color: #1565c0; }
            #${UI_PANEL_ID} button.start { background-color: #ff9800; color: white; }
            #${UI_PANEL_ID} button.start:hover:not(:disabled) { background-color: #f57c00; }
            #${UI_PANEL_ID} button.stop { background-color: #f44336; color: white; }
            #${UI_PANEL_ID} button.stop:hover:not(:disabled) { background-color: #d32f2f; }
            #${UI_PANEL_ID} .panel-footer {
                padding: 8px 12px; border-top: 1px solid #ccc; background: #eee;
                font-size: 12px; color: #555; border-radius: 0 0 8px 8px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            #${UI_TOGGLE_ID} {
                position: fixed; top: 150px; right: 0; background: #1a73e8; color: white; padding: 8px 5px;
                border: none; border-radius: 5px 0 0 5px; cursor: pointer; z-index: 9998; font-size: 18px;
                box-shadow: -2px 2px 5px rgba(0,0,0,0.2); line-height: 1;
            }
             /* Specific button styles for header */
            #${UI_PANEL_ID} .panel-header button {
                 background: none; border: none; font-size: 18px; cursor: pointer; padding: 0 4px;
                 color: #777; line-height: 1; vertical-align: middle;
             }
             #${UI_PANEL_ID} .panel-header button#${UI_STOP_BTN_ID} { color: #f44336; font-size: 16px; }
             #${UI_PANEL_ID} .panel-header button#${UI_CLOSE_BTN_ID} { color: #aaa; font-size: 20px; }
             #${UI_PANEL_ID} .panel-header button:hover { color: #333; }
             #${UI_PANEL_ID} .panel-header button#${UI_STOP_BTN_ID}:hover { color: #c62828; }
        `);
    }

    function createMainUI() {
        if (document.getElementById(UI_PANEL_ID)) return; // Already exists

        const panel = document.createElement('div');
        panel.id = UI_PANEL_ID;
        panel.style.display = 'flex'; // Use flex for layout

        panel.innerHTML = `
            <div class="panel-header">
                <h4>⚙️ Đồng bộ Sách</h4>
                <div class="panel-controls">
                    <button id="${UI_STOP_BTN_ID}" title="Dừng" disabled>⏹️</button>
                    <button id="${UI_CLOSE_BTN_ID}" title="Đóng">×</button>
                </div>
            </div>
            <div class="panel-body">
                <div class="config-section">
                    <label for="${UI_SOURCE_URL_INPUT_ID}">Link nguồn:</label>
                    <input type="url" id="${UI_SOURCE_URL_INPUT_ID}" placeholder="VD: https://fanqienovel.com/page/...">
                    <button id="${UI_FETCH_WIKI_BTN_ID}" class="primary" title="Tải danh sách chương từ Wikidich hiện tại">Tải Wiki</button>
                    <button id="${UI_FETCH_SOURCE_BTN_ID}" class="primary" title="Tải danh sách chương từ link nguồn">Tải Nguồn</button>
                    <label for="${UI_RANGE_INPUT_ID}">Khoảng sync:</label>
                    <input type="text" id="${UI_RANGE_INPUT_ID}" placeholder="VD: 1-100 hoặc 50-">
                    <div></div> <!-- Placeholder for grid alignment -->
                    <div class="action-buttons" style="grid-column: 1 / -1;">
                       <button id="${UI_START_BTN_ID}" class="start" title="Bắt đầu quá trình đồng bộ" disabled>🚀 Bắt đầu</button>
                       <button id="${UI_CLEAR_HISTORY_BTN_ID}" title="Xóa lịch sử đồng bộ của sách này">🗑️ Xóa LS</button>
                    </div>
                </div>
                <div class="list-section">
                    <div class="chapter-list-container">
                        <div class="list-header">Wikidich (<span id="wiki-count">0</span>)</div>
                        <ul class="chapter-list" id="${UI_WIKI_LIST_ID}"><li><i>Chưa tải...</i></li></ul>
                    </div>
                    <div class="chapter-list-container">
                        <div class="list-header">Nguồn (<span id="source-name">Chưa xác định</span>: <span id="source-count">0</span>)</div>
                        <ul class="chapter-list" id="${UI_SOURCE_LIST_ID}"><li><i>Chưa tải...</i></li></ul>
                    </div>
                </div>
            </div>
            <div class="panel-footer" id="${UI_STATUS_ID}">Chờ thao tác...</div>
        `;
        document.body.appendChild(panel);

        // --- Add Event Listeners ---
        document.getElementById(UI_CLOSE_BTN_ID)?.addEventListener('click', () => panel.style.display = 'none');
        document.getElementById(UI_FETCH_WIKI_BTN_ID)?.addEventListener('click', handleFetchWikiChapters);
        document.getElementById(UI_FETCH_SOURCE_BTN_ID)?.addEventListener('click', handleFetchSourceChapters);
        document.getElementById(UI_START_BTN_ID)?.addEventListener('click', handleStartSync);
        document.getElementById(UI_STOP_BTN_ID)?.addEventListener('click', handleStopSync);
        document.getElementById(UI_CLEAR_HISTORY_BTN_ID)?.addEventListener('click', handleClearHistory);

        // Load persisted source URL
        loadFromStorage(getStorageKey(SOURCE_URL_PREFIX, currentBookInfo.key))
          .then(url => {
              if (url) {
                  const input = document.getElementById(UI_SOURCE_URL_INPUT_ID);
                  if (input) input.value = url;
                   // Auto-detect adapter from loaded URL
                   detectAdapter(url);
                   updateUI(); // Update source name in header
              }
          });

         // Load persisted range
         loadFromStorage(getStorageKey(`${STORAGE_PREFIX}last_range_`, currentBookInfo.key))
           .then(range => {
               if (range) {
                   const input = document.getElementById(UI_RANGE_INPUT_ID);
                   if (input) input.value = range;
               }
           });


        return panel;
    }

    function updateUI() {
        const panel = document.getElementById(UI_PANEL_ID);
        if (!panel || panel.style.display === 'none') return;

        const startBtn = document.getElementById(UI_START_BTN_ID);
        const stopBtn = document.getElementById(UI_STOP_BTN_ID);
        const fetchWikiBtn = document.getElementById(UI_FETCH_WIKI_BTN_ID);
        const fetchSourceBtn = document.getElementById(UI_FETCH_SOURCE_BTN_ID);
        const clearBtn = document.getElementById(UI_CLEAR_HISTORY_BTN_ID);
        const rangeInput = document.getElementById(UI_RANGE_INPUT_ID);
        const sourceInput = document.getElementById(UI_SOURCE_URL_INPUT_ID);
        const sourceNameSpan = document.getElementById('source-name');

        // Update button states
        if (startBtn) startBtn.disabled = isSyncRunning || !wikiChapters.length || !sourceChapters.length;
        if (stopBtn) stopBtn.disabled = !isSyncRunning;
        if (fetchWikiBtn) fetchWikiBtn.disabled = isSyncRunning;
        if (fetchSourceBtn) fetchSourceBtn.disabled = isSyncRunning;
        if (clearBtn) clearBtn.disabled = isSyncRunning;
        if (rangeInput) rangeInput.disabled = isSyncRunning;
        if (sourceInput) sourceInput.disabled = isSyncRunning;

        // Update source name
        if (sourceNameSpan) sourceNameSpan.textContent = currentAdapter?.name || 'Chưa xác định';


        // Update chapter lists
        updateChapterListsUI();

        // Update status message (handled by logToStatusUI)
    }

    function updateChapterListsUI() {
        const wikiListUl = document.getElementById(UI_WIKI_LIST_ID);
        const sourceListUl = document.getElementById(UI_SOURCE_LIST_ID);
        const wikiCountSpan = document.getElementById('wiki-count');
        const sourceCountSpan = document.getElementById('source-count');

        if (!wikiListUl || !sourceListUl || !wikiCountSpan || !sourceCountSpan) return;

        wikiCountSpan.textContent = wikiChapters.length;
        sourceCountSpan.textContent = sourceChapters.length;

        const renderList = (ul, chapters, isSourceList = false) => {
            ul.innerHTML = ''; // Clear existing items
            const chaptersToRender = chapters;

            chaptersToRender.forEach(chapter => {
                const li = document.createElement('li');
                const status = chapterStatus[chapter.number] || 'pending';
                li.className = `status-${status}`;
                li.title = `Chương ${chapter.number}: ${chapter.name} (${status})`;
                li.dataset.chapterNumber = chapter.number;

                const numSpan = document.createElement('span');
                numSpan.className = 'ch-num';
                numSpan.textContent = chapter.number;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'ch-name';
                nameSpan.textContent = chapter.name;

                li.appendChild(numSpan);
                li.appendChild(nameSpan);
                ul.appendChild(li);
            });
             // if (chapters.length > MAX_CHAPTERS_TO_DISPLAY) {
             //     const li = document.createElement('li');
             //     li.textContent = `... và ${chapters.length - MAX_CHAPTERS_TO_DISPLAY} chương khác (chỉ hiển thị ${MAX_CHAPTERS_TO_DISPLAY})`;
             //     li.style.fontStyle = 'italic';
             //     li.style.color = '#888';
             //     ul.appendChild(li);
             // }
            if (chapters.length === 0) {
                ul.innerHTML = '<li><i>Danh sách trống</i></li>';
            }
        };

        renderList(wikiListUl, wikiChapters);
        renderList(sourceListUl, sourceChapters, true);

        // Scroll to current processing chapter
        if (currentChapterProcessing) {
            const targetLi = wikiListUl.querySelector(`li[data-chapter-number="${currentChapterProcessing}"]`);
            if (targetLi) {
                targetLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    function logToStatusUI(message, isError = false) {
        const statusDiv = document.getElementById(UI_STATUS_ID);
        if (statusDiv) {
            statusDiv.textContent = `[${getTimestamp()}] ${message}`;
            statusDiv.style.color = isError ? '#d32f2f' : '#333';
            statusDiv.style.fontWeight = isError ? 'bold' : 'normal';
        }
        if (DEBUG) {
            const prefix = isError ? 'ERROR:' : 'INFO:';
            logDebug(prefix, message);
        }
    }

    function scrollToChapter(chapterNumber) {
         const wikiListUl = document.getElementById(UI_WIKI_LIST_ID);
         const sourceListUl = document.getElementById(UI_SOURCE_LIST_ID);

         const scrollToLi = (ul) => {
             if (!ul) return;
             const targetLi = ul.querySelector(`li[data-chapter-number="${chapterNumber}"]`);
             if (targetLi) {
                 targetLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
             }
         };

         scrollToLi(wikiListUl);
         scrollToLi(sourceListUl);
     }

    // --- Core Logic Functions ---

    function getBookInfo() {
        const titleElement = document.querySelector('.cover-info h2');
        const title = titleElement?.textContent?.trim() || 'Unknown Book';

        // Try getting bookId from input first
        let bookId = document.querySelector("input#bookId")?.value;

        // If not found, try regex on page HTML (more robust for different WKD layouts)
         if (!bookId) {
             const bookIdMatch = document.documentElement.innerHTML.match(/bookId['"]?\s*:\s*['"]?(\d+)['"]?/);
             bookId = bookIdMatch?.[1];
         }

        if (!bookId) {
            logToStatusUI("Lỗi nghiêm trọng: Không thể tìm thấy ID sách Wikidich.", true);
            return null;
        }

        // Create a key for storage, combining title and ID for uniqueness and readability
        const key = `${title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}_${bookId}`;
        logDebug(`Book Info: Title='${title}', ID='${bookId}', Key='${key}'`);
        logDebug(`>>> MAIN PAGE Book Key Created: '${key}'`); // Log key được tạo
        return { id: bookId, title: title, key: key };
    }

    function detectAdapter(url) {
        if (!url) {
            currentAdapter = null;
            return null;
        }
        for (const key in apiAdapters) {
            const adapter = apiAdapters[key];
            if (adapter.detect(url)) {
                currentAdapter = adapter;
                logDebug(`Detected source adapter: ${adapter.name}`);
                saveToStorage(getStorageKey(CURRENT_ADAPTER_PREFIX, currentBookInfo.key), key); // Save adapter key
                 if (adapter.requiresApi && FANQIE_API === FANQIE_API_DEFAULT) {
                     logDebug("Adapter requires API, ensuring API endpoint is initialized.");
                     initializeApiEndpoint(); // Ensure API endpoint is ready if needed
                 }
                return adapter;
            }
        }
        currentAdapter = null;
        logDebug(`No adapter found for URL: ${url}`);
         GM_deleteValue(getStorageKey(CURRENT_ADAPTER_PREFIX, currentBookInfo.key)); // Clear saved adapter
        return null;
    }

    function detectSourceLinkOnPage() {
        const links = document.querySelectorAll('.book-desc a, .tab-content a'); // Check description and other tabs
        for (const link of links) {
            const url = link.href;
            if (url) {
                for (const key in apiAdapters) {
                    if (apiAdapters[key].detect(url)) {
                        logDebug(`Auto-detected source link on page: ${url} (Adapter: ${apiAdapters[key].name})`);
                        const input = document.getElementById(UI_SOURCE_URL_INPUT_ID);
                        if (input) input.value = url;
                        detectAdapter(url); // Set current adapter
                        return url;
                    }
                }
            }
        }
        logDebug("No known source link auto-detected on the page.");
        return null;
    }

    async function loadPersistedData() {
        if (!currentBookInfo) return;
        logDebug("Loading persisted data...");

        const wikiKey = getStorageKey(WIKI_LIST_PREFIX, currentBookInfo.key);
        const sourceKey = getStorageKey(SOURCE_LIST_PREFIX, currentBookInfo.key);
        const statusKey = getStorageKey(PROCESS_STATUS_PREFIX, currentBookInfo.key);
        const adapterKey = getStorageKey(CURRENT_ADAPTER_PREFIX, currentBookInfo.key);

        wikiChapters = await loadFromStorage(wikiKey, []);
        sourceChapters = await loadFromStorage(sourceKey, []);
        chapterStatus = await loadFromStorage(statusKey, {});

        // Load and set adapter
         const savedAdapterKey = await GM_getValue(adapterKey, null); // Use GM_getValue directly for simple string
         if (savedAdapterKey && apiAdapters[savedAdapterKey]) {
             currentAdapter = apiAdapters[savedAdapterKey];
             logDebug(`Loaded adapter from storage: ${currentAdapter.name}`);
              if (currentAdapter.requiresApi && FANQIE_API === FANQIE_API_DEFAULT) {
                  initializeApiEndpoint();
              }
         } else {
              currentAdapter = null; // Ensure it's null if not found/invalid
              logDebug("No valid adapter found in storage.");
              // Try auto-detection again if URL exists
              const savedUrl = await loadFromStorage(getStorageKey(SOURCE_URL_PREFIX, currentBookInfo.key));
              if(savedUrl) detectAdapter(savedUrl);
         }


        logDebug(`Loaded ${wikiChapters.length} wiki chapters, ${sourceChapters.length} source chapters, ${Object.keys(chapterStatus).length} status entries.`);

        // Initialize status for chapters that don't have one yet
        wikiChapters.forEach(ch => {
            if (!(ch.number in chapterStatus)) {
                chapterStatus[ch.number] = 'pending';
            }
        });

        // Remove status for chapters no longer in the list (optional cleanup)
        const validWikiNumbers = new Set(wikiChapters.map(ch => ch.number));
        Object.keys(chapterStatus).forEach(numStr => {
            const num = parseInt(numStr);
            if (!validWikiNumbers.has(num)) {
                delete chapterStatus[num];
            }
        });

        updateUI();
    }

    async function saveChapterStatus() {
        if (!currentBookInfo) return;
        const key = getStorageKey(PROCESS_STATUS_PREFIX, currentBookInfo.key);
        await saveToStorage(key, chapterStatus);
    }

    function findChapterData(chapterNumber) {
        const wikiChapter = wikiChapters.find(ch => ch.number === chapterNumber);
        const sourceChapter = sourceChapters.find(ch => ch.number === chapterNumber);

        if (!wikiChapter) {
            logDebug(`Could not find Wiki chapter data for number: ${chapterNumber}`);
            return null;
        }
        if (!sourceChapter) {
            logDebug(`Could not find Source chapter data for number: ${chapterNumber}`);
            // Allow proceeding without source if only checking needed? No, update requires source.
            return null;
        }
         if (!sourceChapter.id) {
             logDebug(`Source chapter data for number ${chapterNumber} is missing required 'id'. Source data:`, sourceChapter);
             return null;
         }

        return {
            wiki: wikiChapter,
            source: sourceChapter
        };
    }

    // --- Button Handlers & Sync Control ---

    async function handleFetchWikiChapters() {
        if (!currentBookInfo) return;
        logToStatusUI("Đang tải danh sách chương Wikidich...");
        const btn = document.getElementById(UI_FETCH_WIKI_BTN_ID);
        if(btn) btn.disabled = true;

        try {
            wikiChapters = await WikiChapterFetcher.getAllChapters(location.href);
            // Reset status for newly fetched list, keeping existing history is better
            // chapterStatus = {}; // Reset status or merge? Let's merge.
             const newStatus = {};
             wikiChapters.forEach(ch => {
                 newStatus[ch.number] = chapterStatus[ch.number] || 'pending'; // Keep old status or default to pending
             });
             chapterStatus = newStatus;

            await saveToStorage(getStorageKey(WIKI_LIST_PREFIX, currentBookInfo.key), wikiChapters);
            await saveChapterStatus(); // Save potentially updated status
            logToStatusUI(`✅ Tải xong ${wikiChapters.length} chương Wikidich.`);
        } catch (error) {
            console.error("Error fetching Wikidich chapters:", error);
            logToStatusUI(`❌ Lỗi tải DS Wiki: ${error.message}`, true);
            wikiChapters = await loadFromStorage(getStorageKey(WIKI_LIST_PREFIX, currentBookInfo.key), []); // Reload old list on error
        } finally {
            if(btn) btn.disabled = isSyncRunning; // Re-enable based on running state
            updateUI();
        }
    }

    async function handleFetchSourceChapters() {
        if (!currentBookInfo) return;
        const urlInput = document.getElementById(UI_SOURCE_URL_INPUT_ID);
        const url = urlInput?.value?.trim();
        if (!url) {
            logToStatusUI("Vui lòng nhập link nguồn.", true);
            return;
        }

        const adapter = detectAdapter(url);
        if (!adapter) {
            logToStatusUI("Link nguồn không được hỗ trợ hoặc không hợp lệ.", true);
            return;
        }

        const sourceBookId = adapter.extractBookId(url);
        if (!sourceBookId) {
            logToStatusUI("Không thể trích xuất ID sách từ link nguồn.", true);
            return;
        }

        logToStatusUI(`Đang tải DS chương từ ${adapter.name}...`);
        const btn = document.getElementById(UI_FETCH_SOURCE_BTN_ID);
        if(btn) btn.disabled = true;
        await saveToStorage(getStorageKey(SOURCE_URL_PREFIX, currentBookInfo.key), url); // Save the valid URL

        adapter.fetchDirectory(sourceBookId, async (chapters) => {
            if (chapters && chapters.length > 0) {
                sourceChapters = chapters;
                await saveToStorage(getStorageKey(SOURCE_LIST_PREFIX, currentBookInfo.key), sourceChapters);
                logToStatusUI(`✅ Tải xong ${sourceChapters.length} chương từ ${adapter.name}.`);
            } else {
                logToStatusUI(`⚠️ Không tải được chương nào từ ${adapter.name}.`, !chapters); // Show as error if null
                sourceChapters = await loadFromStorage(getStorageKey(SOURCE_LIST_PREFIX, currentBookInfo.key), []); // Reload old list
            }
            if(btn) btn.disabled = isSyncRunning;
            updateUI();
        });
    }

    async function handleStartSync() {
        if (isSyncRunning) return;

        const rangeInput = document.getElementById(UI_RANGE_INPUT_ID);
        const range = parseRange(rangeInput?.value);
        if (!range) {
            logToStatusUI("Khoảng chương không hợp lệ. Định dạng: BĐ-KT hoặc BĐ-", true);
            return;
        }

        if (!wikiChapters.length || !sourceChapters.length) {
            logToStatusUI("Cần tải danh sách chương Wiki và Nguồn trước khi bắt đầu.", true);
            return;
        }

         // Save the current range
         await saveToStorage(getStorageKey(`${STORAGE_PREFIX}last_range_`, currentBookInfo.key), rangeInput.value);


        isSyncRunning = true;
         await GM_setValue(getStorageKey(IS_RUNNING_PREFIX, currentBookInfo.key), true); // Persist running state


        // Build the queue of chapters to process within the range
        syncQueue = wikiChapters
            .map(ch => ch.number)
            .filter(num => num >= range.start && num <= range.end)
            .filter(num => ['pending', 'error', 'submit_triggered'].includes(chapterStatus[num] || 'pending')) // Retry errors and pending, check triggered state
            .sort((a, b) => a - b); // Ensure processing order

        if (syncQueue.length === 0) {
            logToStatusUI(`Không có chương nào trong khoảng ${rangeInput.value} cần xử lý.`);
            isSyncRunning = false;
            await GM_setValue(getStorageKey(IS_RUNNING_PREFIX, currentBookInfo.key), false);
            updateUI();
            return;
        }

        logToStatusUI(`🚀 Bắt đầu đồng bộ ${syncQueue.length} chương từ ${range.start} đến ${range.end === Infinity ? 'cuối' : range.end}...`);
        updateUI();

        // Start the processing loop
        processNextChapter();
    }

    async function handleStopSync() {
        if (!isSyncRunning) return;
        logToStatusUI("⏹️ Đang dừng đồng bộ...");
        isSyncRunning = false;
        await GM_setValue(getStorageKey(IS_RUNNING_PREFIX, currentBookInfo.key), false);


        if (editPageTimeoutId) {
            clearTimeout(editPageTimeoutId);
            editPageTimeoutId = null;
        }
        if (currentChapterProcessing) {
            // Reset status of the chapter that was interrupted
            if (chapterStatus[currentChapterProcessing] === 'processing') {
                chapterStatus[currentChapterProcessing] = 'pending'; // Or maybe keep 'processing' to indicate interruption? Pending is safer.
                await saveChapterStatus();
            }
        }
        syncQueue = [];
        currentChapterProcessing = null;

        logToStatusUI("⏹️ Đồng bộ đã dừng.");
        updateUI();
    }

    async function handleClearHistory() {
        if (isSyncRunning) {
            logToStatusUI("Vui lòng dừng đồng bộ trước khi xóa lịch sử.", true);
            return;
        }
        if (confirm(`Bạn có chắc muốn xóa lịch sử đồng bộ cho sách "${currentBookInfo.title}" không? Thao tác này sẽ đặt lại trạng thái tất cả chương thành 'pending'.`)) {
            chapterStatus = {}; // Clear status object
            wikiChapters.forEach(ch => {
                chapterStatus[ch.number] = 'pending'; // Reset all to pending
            });
            await saveChapterStatus(); // Save the cleared status
            logToStatusUI("🗑️ Đã xóa lịch sử đồng bộ.");
            updateUI();
        }
    }

    async function processNextChapter() {
        if (!isSyncRunning || syncQueue.length === 0) {
            if (isSyncRunning) { // Finished queue
                 logToStatusUI("🏁 Đã xử lý hết các chương trong khoảng đã chọn.");
                 handleStopSync(); // Call stop to clean up state
            } else {
                 logDebug("Sync stopped or queue empty, ending process loop.");
            }
            updateUI();
            return;
        }

        currentChapterProcessing = syncQueue.shift(); // Get the next chapter number
        logDebug(`Processing next chapter: ${currentChapterProcessing}`);

        const chapterData = findChapterData(currentChapterProcessing);

        if (!chapterData || !chapterData.wiki?.url || !chapterData.source?.id) {
            logToStatusUI(`❌ Thiếu dữ liệu (Wiki URL hoặc Source ID) cho chương ${currentChapterProcessing}. Bỏ qua.`, true);
            chapterStatus[currentChapterProcessing] = 'skipped'; // Mark as skipped due to missing data
            currentChapterProcessing = null;
             await saveChapterStatus();
             updateUI();
            setTimeout(processNextChapter, 50); // Move to next quickly
            return;
        }

        // Update status to 'processing'
        chapterStatus[currentChapterProcessing] = 'processing';
        await saveChapterStatus();
        logToStatusUI(`⚙️ Đang xử lý chương ${currentChapterProcessing}...`);
         scrollToChapter(currentChapterProcessing); // Scroll lists to the chapter
        updateUI(); // Reflect 'processing' state

        // Open the edit page
        const editUrl = `${chapterData.wiki.url}/chinh-sua#sync-${currentChapterProcessing}-${currentBookInfo.key}`; // Add book key for edit page context
        logDebug(`Opening edit page: ${editUrl}`);
        openEditPage(editUrl, currentChapterProcessing);

        // Set a timeout for the edit page to respond
        if (editPageTimeoutId) clearTimeout(editPageTimeoutId);
        editPageTimeoutId = setTimeout(async () => {
             logDebug(`Timeout waiting for edit page of chapter ${currentChapterProcessing}`);
             if (isSyncRunning && chapterStatus[currentChapterProcessing] === 'processing') { // Check if it's still relevant
                logToStatusUI(`⏰ Timeout chờ phản hồi từ tab chỉnh sửa chương ${currentChapterProcessing}. Đánh dấu lỗi.`, true);
                chapterStatus[currentChapterProcessing] = 'error'; // Mark as error on timeout
                 currentChapterProcessing = null;
                await saveChapterStatus();
                updateUI();
                 if(isSyncRunning) setTimeout(processNextChapter, NEXT_CHAPTER_DELAY); // Continue after timeout error
             }
             editPageTimeoutId = null;
        }, EDIT_PAGE_TIMEOUT);
    }

    function openEditPage(url, chapterNumber) {
        // Consider potential popup blockers. Opening directly might be blocked.
        // A small delay or user interaction might be needed in some browsers.
        try {
            // const newTab = window.open(url, '_blank');
            const newTab = window.open(
                url,
                'popupWindow',
                'width=400,height=300,left=200,top=100,resizable=yes,scrollbars=yes'
            );

             if (!newTab) {
                 throw new Error("Popup bị chặn hoặc lỗi mở tab mới.");
             }
        } catch (e) {
             logToStatusUI(`❌ Lỗi mở tab chỉnh sửa cho chương ${chapterNumber}: ${e.message}. Vui lòng cho phép popup.`, true);
             // Handle error: mark chapter as error and continue?
             if (isSyncRunning && currentChapterProcessing === chapterNumber) {
                 chapterStatus[chapterNumber] = 'error';
                 saveChapterStatus();
                 currentChapterProcessing = null;
                 updateUI();
                 setTimeout(processNextChapter, NEXT_CHAPTER_DELAY); // Try next one
             }
        }
    }

    async function handleEditTabUpdate(name, oldStatusJson, newStatusJson, remote) {
        if (!remote || !isSyncRunning || !currentChapterProcessing) {
            // logDebug("Ignoring status update (not remote, not running, or not processing).");
            return; // Ignore local changes or changes when not running/expecting
        }

        let statusUpdate;
        try {
             statusUpdate = JSON.parse(newStatusJson);
        } catch(e) {
             logDebug("Error parsing status update:", e);
             return;
        }


        // Check if the update is for the currently processed chapter and matches the book key
        if (statusUpdate?.bookKey === currentBookInfo.key && statusUpdate?.chapterNumber === currentChapterProcessing) {
            const reportedStatus = statusUpdate.status;
            const chapterNum = statusUpdate.chapterNumber;
            logDebug(`Received status update from edit tab for chapter ${chapterNum}: ${reportedStatus}`);

            // Clear the timeout for this chapter
            if (editPageTimeoutId) {
                clearTimeout(editPageTimeoutId);
                editPageTimeoutId = null;
                logDebug(`Cleared timeout for chapter ${chapterNum}.`);
            }

            // Update chapter status based on report
            if (['checked_ok', 'updated_hidden', 'error'].includes(reportedStatus)) {
                 chapterStatus[chapterNum] = reportedStatus;
                 await saveChapterStatus();
                 logToStatusUI(`✅ Chương ${chapterNum}: ${reportedStatus === 'checked_ok' ? 'Kiểm tra OK' : (reportedStatus === 'updated_hidden' ? 'Đã cập nhật nội dung ẩn' : 'Báo lỗi từ tab edit')}.`);
                 currentChapterProcessing = null; // Mark as done processing this one
                 updateUI();
                 // Schedule the next chapter processing
                 setTimeout(processNextChapter, NEXT_CHAPTER_DELAY);
             } else if (reportedStatus === 'submit_triggered') {
                 // Mark as triggered, but wait for potential 'updated_hidden' confirmation later?
                 // For now, let's treat 'submit_triggered' as success and move on.
                 // The edit tab itself should ideally report 'updated_hidden' after reload.
                 chapterStatus[chapterNum] = 'submit_triggered'; // Use a distinct status
                 await saveChapterStatus();
                 logToStatusUI(`➡️ Chương ${chapterNum}: Đã gửi cập nhật. Chuyển chương tiếp theo...`);
                 currentChapterProcessing = null;
                 updateUI();
                 setTimeout(processNextChapter, NEXT_CHAPTER_DELAY);
             } else {
                 logDebug(`Received unknown status '${reportedStatus}' for chapter ${chapterNum}. Ignoring.`);
             }
         } else {
            // logDebug("Ignoring status update for different chapter/book:", statusUpdate);
         }
    }


    // --- Edit Page Logic ---

    function getEditPageInfo() {
        const hash = location.hash;
        const match = hash.match(/^#sync-(\d+)-(.+)$/); // Matches #sync-CHAPTER_NUM-BOOK_KEY
        if (match) {
            const chapterNumber = parseInt(match[1]);
            const bookKey = match[2];
            logDebug(`Edit page info: Chapter=${chapterNumber}, BookKey=${bookKey}`);
            logDebug(`>>> EDIT PAGE Book Key Parsed: '${bookKey}'`); // Log key đọc được
            return { chapterNumber, bookKey };
        }
        logDebug("Edit page opened without valid #sync hash.");
        return null;
    }

    async function checkAndProcessContent(editInfo) {
        const { chapterNumber, bookKey } = editInfo;
        logDebug(`Processing edit page for chapter ${chapterNumber}`);

         // Check for post-submit flag (using sessionStorage for non-persistence)
         const submittedChapter = sessionStorage.getItem(`${SCRIPT_ID}_submitted_chapter`);
         if (submittedChapter === String(chapterNumber)) {
             logDebug(`Detected post-submit state for chapter ${chapterNumber}. Reporting success.`);
             sessionStorage.removeItem(`${SCRIPT_ID}_submitted_chapter`); // Clear flag
             await reportStatusAndClose(bookKey, chapterNumber, 'updated_hidden', TAB_CLOSE_DELAY_SUBMIT);
             return; // Stop further processing
         }


        const contentTextArea = document.getElementById('txtContentCn');
        const form = document.getElementById('formEditChapter');
        const submitButton = form?.querySelector('button[type="submit"], input[type="submit"]');

        if (!contentTextArea || !form || !submitButton) {
            logDebug("Edit page elements not found (textarea, form, or submit button).");
            await reportStatusAndClose(bookKey, chapterNumber, 'error', TAB_CLOSE_DELAY_ERROR);
            return;
        }

        const currentContent = contentTextArea.value || '';
        // More specific regex for the hidden content pattern
        const hiddenContentPattern = /(\*{6,})\s*后面还有\s*\d+\s*个字内容被隐藏了\s*\1/i;
        const hasHiddenContent = hiddenContentPattern.test(currentContent);

        if (!hasHiddenContent) {
            logDebug(`No hidden content found for chapter ${chapterNumber}.`);
            await reportStatusAndClose(bookKey, chapterNumber, 'checked_ok', TAB_CLOSE_DELAY_OK);
            return;
        }

        logDebug(`Hidden content found for chapter ${chapterNumber}. Fetching source content...`);

        // Load necessary data: Source list and adapter info
         const sourceListKey = getStorageKey(SOURCE_LIST_PREFIX, bookKey);
         const adapterKey = getStorageKey(CURRENT_ADAPTER_PREFIX, bookKey);
         const chapters = await loadFromStorage(sourceListKey, []);
         const savedAdapterKey = await GM_getValue(adapterKey, null).trim().replace(/^"|"$/g, ''); // Direct GM_getValue for key
         if (!chapters || chapters.length === 0 || !savedAdapterKey || !apiAdapters[savedAdapterKey]) {
            logDebug("Missing source chapter list or adapter info in storage.");
            await reportStatusAndClose(bookKey, chapterNumber, 'error', TAB_CLOSE_DELAY_ERROR);
            return;
         }

         const sourceAdapter = apiAdapters[savedAdapterKey];
          if (sourceAdapter.requiresApi && FANQIE_API === FANQIE_API_DEFAULT) {
             await initializeApiEndpoint(); // Ensure API is ready
          }

        const sourceChapter = chapters.find(ch => ch.number === chapterNumber);
        if (!sourceChapter || !sourceChapter.id) {
            logDebug(`Could not find matching source chapter or source chapter ID for chapter ${chapterNumber}.`);
            await reportStatusAndClose(bookKey, chapterNumber, 'error', TAB_CLOSE_DELAY_ERROR);
            return;
        }

        // Fetch content using the adapter
        try {
             const fullContent = await new Promise((resolve) => {
                 sourceAdapter.fetchContent(sourceChapter.id, resolve);
             });

             if (fullContent === null || fullContent.trim() === '') { // Check for null or empty string
                 logDebug(`Failed to fetch or received empty content from source for chapter ${chapterNumber} (Source ID: ${sourceChapter.id}).`);
                 await reportStatusAndClose(bookKey, chapterNumber, 'error', TAB_CLOSE_DELAY_ERROR);
                 return;
             }

             logDebug(`Successfully fetched source content for chapter ${chapterNumber}. Length: ${fullContent.length}. Updating textarea...`);

             // Replace only the hidden text marker and following lines if possible,
             // or replace the entire content if simpler/safer. Replacing all is safer.
             // Let's try replacing all for simplicity first.
             contentTextArea.value = fullContent;
              // Dispatch events to ensure frameworks (if any) recognize the change
              contentTextArea.dispatchEvent(new Event('input', { bubbles: true }));
              contentTextArea.dispatchEvent(new Event('change', { bubbles: true }));


              logDebug(`Content updated. Setting submit flag and submitting form for chapter ${chapterNumber}...`);
              // Set flag *before* submitting
              sessionStorage.setItem(`${SCRIPT_ID}_submitted_chapter`, String(chapterNumber));

              // Report 'submit_triggered' BEFORE submitting, as the page will navigate away.
              // The main page will use this to proceed. The reload check handles final confirmation.
              const statusPayload = JSON.stringify({ bookKey: bookKey, chapterNumber: chapterNumber, status: 'submit_triggered' });
              await GM_setValue(EDIT_TAB_STATUS_PREFIX + bookKey, statusPayload); // Report trigger


              // Submit the form
              // form.requestSubmit(submitButton); // Modern way
              submitButton.click(); // More compatible way

             // Script execution likely ends here due to navigation.
             // No explicit close needed here; the reload handler will take over.

        } catch (fetchError) {
             logDebug(`Error during source content fetch for chapter ${chapterNumber}:`, fetchError);
             await reportStatusAndClose(bookKey, chapterNumber, 'error', TAB_CLOSE_DELAY_ERROR);
        }
    }

    async function reportStatusAndClose(bookKey, chapterNumber, status, closeDelay) {
        logDebug(`Reporting status '${status}' for chapter ${chapterNumber} and scheduling close (${closeDelay}ms).`);
        const statusPayload = JSON.stringify({ bookKey, chapterNumber, status });
         try {
            await GM_setValue(EDIT_TAB_STATUS_PREFIX + bookKey, statusPayload);
            // Schedule tab closure
            setTimeout(() => {
                 logDebug(`Closing edit tab for chapter ${chapterNumber}.`);
                 window.close();
             }, closeDelay);
         } catch (e) {
             logDebug("Error reporting status:", e);
              // Still try to close
              setTimeout(() => {
                  logDebug(`Closing edit tab for chapter ${chapterNumber} after reporting error.`);
                  window.close();
              }, closeDelay);
         }
    }


    // --- Initialization and Page Routing ---
    async function initialize() {
        logDebug("Script initializing...");
         await initializeApiEndpoint(); // Initialize API endpoint early

        const path = location.pathname;
        const hash = location.hash;

        // --- Edit Page Route ---
        if (path.includes('/chinh-sua') && hash.startsWith('#sync-')) {
            logDebug("Running on Edit Page");
            const editInfo = getEditPageInfo();
            if (editInfo) {
                try {
                     // Small delay to ensure page elements are fully ready
                     await new Promise(resolve => setTimeout(resolve, 500));
                     await checkAndProcessContent(editInfo);
                 } catch (e) {
                     console.error(`[${SCRIPT_ID}] Unhandled error on edit page:`, e);
                      // Try to report generic error if possible
                      if (editInfo) {
                          await reportStatusAndClose(editInfo.bookKey, editInfo.chapterNumber, 'error', TAB_CLOSE_DELAY_ERROR);
                      }
                 }
            }
             // Don't run book page logic on edit page
             return;
        }

        // --- Book Page Route ---
        // Regex to match main book page URL like /truyen/book-slug--BOOKID
        // Or /truyen/book-slug
         const bookPageMatch = path.match(/^\/truyen\/([^\/]+)$/); // Matches /truyen/slug--ID or /truyen/slug
        if (bookPageMatch && !path.includes('/chuong-') && !path.endsWith('/chinh-sua')) {

            logDebug("Running on Book Page");
            currentBookInfo = getBookInfo();
            if (!currentBookInfo) {
                logDebug("Could not get book info. Aborting.");
                return;
            }

            addStyles(); // Add styles first
            createMainUI(); // Create the UI elements
            detectSourceLinkOnPage(); // Try to find source link automatically
            await loadPersistedData(); // Load saved lists and status

             // Restore running state if page reloaded while running
             const wasRunning = await GM_getValue(getStorageKey(IS_RUNNING_PREFIX, currentBookInfo.key), false);
             if(wasRunning) {
                 logDebug("Detected previous running state. Restarting sync process...");
                 // Need to reconstruct the queue based on persisted status and last range
                 const lastRangeStr = await loadFromStorage(getStorageKey(`${STORAGE_PREFIX}last_range_`, currentBookInfo.key));
                 const rangeInput = document.getElementById(UI_RANGE_INPUT_ID);
                  if (rangeInput && lastRangeStr) rangeInput.value = lastRangeStr; // Restore range in UI

                 if (lastRangeStr) {
                     handleStartSync(); // This will rebuild queue and start
                 } else {
                      logDebug("Could not restore range, stopping.");
                      handleStopSync();
                 }
             } else {
                  updateUI(); // Initial UI update after loading data
             }


            // Add listener for status updates from edit tabs
            const listenerKey = EDIT_TAB_STATUS_PREFIX + currentBookInfo.key;
             if(statusListenerId) GM_removeValueChangeListener(statusListenerId); // Remove old listener if any
             statusListenerId = GM_addValueChangeListener(listenerKey, handleEditTabUpdate);
             logDebug(`Listening for edit tab status updates on key: ${listenerKey}`);


            // Add UI toggle button
            const toggleButton = document.createElement('button');
            toggleButton.id = UI_TOGGLE_ID;
            toggleButton.textContent = '⚙️';
            toggleButton.title = 'Hiện/Ẩn Bảng Đồng Bộ Sách';
            toggleButton.onclick = () => {
                const panel = document.getElementById(UI_PANEL_ID);
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
                    if (panel.style.display === 'flex') {
                        updateUI(); // Refresh UI content when shown
                    }
                }
            };
            document.body.appendChild(toggleButton);

            // Add menu command
            GM_registerMenuCommand("Hiện/Ẩn Bảng Đồng Bộ Sách", () => {
                const panel = document.getElementById(UI_PANEL_ID);
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
                     if (panel.style.display === 'flex') {
                        updateUI(); // Refresh UI content when shown
                    }
                }
            }, 'b'); // Shortcut key 'b'


        } else {
            logDebug("Not a target page (Book Main or Edit with #sync).");
        }
    }

    // --- Run Initialization ---
    // Wait for document idle or complete state
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initialize();
    } else {
        window.addEventListener('DOMContentLoaded', initialize, { once: true });
    }

})(); // End IIFE