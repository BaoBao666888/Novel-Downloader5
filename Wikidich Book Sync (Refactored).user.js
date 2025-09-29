// ==UserScript==
// @name         Wikidich Book Sync (Refactored)
// @namespace    https://github.com/BaoBao666888/
// @author       QuocBao
// @version      4.2.0
// @description  Syncs Wikidich chapters with a source (e.g., Fanqie, 69shuba) directly from the book page, handles hidden/empty content.
// @icon         data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAFgAAACgAAABAAAAAgAAAAAEAIAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAADaxiYA2sYmAdrGJnPaxibZ2sYm+9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibf2sYmgNrGJgbaxiYA2sYmAtrGJpzaxib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiaw2sYmCNrGJm3axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJn/axibd2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibl2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cUg/9jDG//Ywxr/2MMZ/9jDGf/Ywxr/2cQd/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSL/2cQd/9jDGv/Ywxn/2MMZ/9jDGf/Ywxv/2cQe/9rFI//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUi/9jDGv/Ywxr/28cp/+DORf/l12X/6dx6/+vgh//r4If/6Nt1/+PTVv/dyjT/2cQe/9jDGf/ZxB//2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cQd/9jDGf/ZxSD/3cs3/+PUWv/o3Hf/6+CH/+vgh//q3oH/5tls/+HRT//cyC7/2cQc/9jDGf/ZxSD/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/2MMa/93LN//n2nL/8eqt//n23P/+/vr//////////////////////////////////Prs//Xvw//r4In/4M9G/9nEHf/ZxB3/2sYm/9rGJP/Ywxr/2sYm/+LTVf/t45L/9vHI//377v//////////////////////////////////////+/jk//PtuP/p3n//381B/9nEHP/ZxB7/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/Ywxj/3sw7/+/moP/9++7///////////////////////////////////////////////////////////////////////7++f/z7bf/4dFN/9jCF//axiX/6d16//j01f////////////////////////////////////////////////////////////////////////////799f/y67L/4M9I/9jDGP/axiT/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nFIf/ZxR//6d19//z77P/////////////////////////////////////////////////////////////////////////////////////////////++//w56T/9/LN//////////////////////////////////////////////////////////////////////////////////////////////////799v/s4Yr/2sYj/9nEH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEH//byCz/8+yz//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Xww//dyzj/2cQc/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEHv/cyS//9/LN//////////////////////////////////////////////////389P/7+OT/+PXX//n12P/8+un////9///////////////////////////////////////////////////////////////////////////////9//z66//59tz/+PTV//r33//8++7/////////////////////////////////////////////////+vji/+HQSf/Zwxv/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nFIP/cyS//9/LN///////////////////////////////////////59tv/7eOS/+PUWv/ezDv/3Mgt/9rGJf/axib/3Mkx/+DQSf/p3Xr/9vHI//////////////////////////////////////////////////799f/z7LX/6Ntz/+DQSf/cyTL/28co/9rGJP/bxyr/3co1/+LSUP/r34X/9/PQ///////////////////////////////////////7+ej/385C/9nEHf/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/ZxR//9O68//////////////////////////////////r44v/o23X/28co/9jCGP/ZxBz/2cUh/9rGI//axiX/2sYk/9rFI//ZxB//2MMY/9nFIP/k1V//9vLL/////////////////////////////v76/+/mnv/fzT//2MMb/9jDGf/ZxB//2sUj/9rGJP/axiX/2sYk/9rFIv/ZxB7/2MMY/9rFIv/l1mP/+fXX//////////////////////////////////n12P/byCv/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/6t6B//////////////////////////////////Pstv/cyjL/2MMX/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMa/9rFIv/r4Ib//fvv////////////+fXY/+LSUf/Ywxf/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMZ/9vIKf/w6KX/////////////////////////////////8emr/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/380///788/////////////////////////////Hpqf/ZxB7/2cUg/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSH/2MMX//bwxf//////9e/A/9zJLf/Zwxv/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/2MMa/+zhiv/////////////////////////////////m2Gf/2cQa/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMa//Hpqf////////////////////////////PstP/ZxB7/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMZ/+3jkv//////9fDE/9rGJv/ZxR//2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/Ywxf/7uSW////////////////////////////+vfh/9vIKv/axiP/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUh/97MO//+/fX///////////////////////r44f/cyS7/2cUg/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+PTVf////7/+/jj/93KMv/ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYj/9nFHv/178H////////////////////////////p3Xv/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDGv/o3Hf////////////////////////////n2m//2MMY/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYl/9rFIv/388///////+TWYP/Ywxn/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/381A//388///////////////////////+PTS/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/8+y2///////////////////////59tv/2sYm/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSP/2cUh/9rFIv/axiX/2sYm/9nEG//m12b///////Pstf/Ywxr/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUj/9nFIf/ZxSL/2sYl/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDF//u5Zr//////////////////////////P/gz0j/2cUf/9rGJv/axib/2sYm/9rGJv/axiT/3Mgs//v45P//////////////////////7eKR/9jDGP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFI//Ywxv/3Mkv/97MPv/dyzf/2cQf/9nEHv/ZxB3/9e/C///////h0U7/2cQd/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiP/2MMa/9zILv/ezD7/3cs4/9nEH//ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/381A//799v//////////////////////6d5+/9jDGf/axib/2sYm/9rGJv/axib/2cQe/+HRTv////7//////////////////////+LSU//ZxB3/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFIv/bxyj/7uSW//v45P/+/fb//fvv//Tuu//fzkL/3co0///++//38sv/2cQe/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/28cn/+3jlP/7+OP//v32//378P/07r3/4dBK/9nEHP/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/28MX///////////////////////Lrs//ZxBv/2sYm/9rGJv/axib/2sYm/9jDGv/o23b///////////////////////z67P/cyjL/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSD/8+23////////////////////////////+/nl/+3jk///////6t5+/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2cUg//PstP////////////////////////////377//gz0X/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/7eKP///////////////////////59tz/28cn/9rGJP/axib/2sYm/9rGJv/Ywxn/7uSZ///////////////////////489D/2sUi/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/5tlr///////////////////////////////////////////////8/+HQSf/ZxR//2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+bYaP//////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYaf///////////////////////fzz/97MOv/axSH/2sYm/9rGJv/axib/2MMb//LqsP//////////////////////9O26/9jDHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe//XwxP////////////////////////////////////////////v55v/cyC3/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/177/////////////////////////////////////////+/P/gz0f/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i01T///////////////////////7++//fzkT/2cUg/9rGJv/axib/2sYm/9nEHf/07r////////////////////////Dopv/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUi/93LNv/9/PH////////////////////////////////////////////38s3/2sUh/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rFIv/dyjT//fvu////////////////////////////////////////////6dx5/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56H/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lD/////////////////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4dFO/////////////////////////////////////////////////+/mnf/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBz/5ddl//////////////////////////////////////////////////Ptuf/ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+XWY//////////////////////////////////////////////////z7LX/2cQb/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bZa//////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//n2Gn/////////////////////////////////////////////////9e68/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGP/axiX/2sYl/9rGJf/axiX/2sYl/9rGJf/Ywxr/5thq//////////////////////////////////////////////////Ptuf/YxBv/2sYl/9rGJf/axiX/2sYl/9rGJf/axiX/2MMa/+bXaP/////////////////////////////////////////////////07bv/2cQb/9rGJf/axiX/2sYl/9rGJf/axiX/2sYl/9nEHf/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/078D//////////////////////+/mn//XwRL/2cQf/9nEH//ZxB//2cQf/9nEH//ZxB//18EU/+XXZv/////////////////////////////////////////////////z7bf/18IV/9nEH//ZxB//2cQf/9nEH//ZxB//2cQf/9fBFP/l1mP/////////////////////////////////////////////////9O25/9jCFf/ZxB//2cQf/9nEH//ZxB//2cQf/9nEH//Ywhf/4dFO///////////////////////+/vv/385E/9nFIP/axib/2sYm/9rGJv/ZxBz/8+25///////////////////////7+ej/9fDE//bxyP/28cj/9vHI//bxyP/28cj/9vHI//Xwxf/59dn//////////////////////////////////////////////////Pvt//Xwxf/28cj/9vHI//bxyP/28cj/9vHI//bxyP/18MX/+fXZ//////////////////////////////////////////////////z77v/28MX/9vHI//bxyP/28cj/9vHI//bxyP/28cj/9vDG//j00////////////////////////v73/9/NP//ZxSH/2sYm/9rGJv/axib/2MMZ/+zijf/////////////////////////////////////////////////////////////////////////////////////////////////+/ff//////////////////////////////////////////////////////////////////////////////////////////////////v33//////////////////////////////////////////////////////////////////////////////////////////////////n22//bxib/2sYk/9rGJv/axib/2sYm/9nEHv/i0U/////+////////////////////////////////////////////////////////////////////////////////////////////7eOT//z66////////////////////////////////////////////////////////////////////////////////////////////+7klv/7+eb////////////////////////////////////////////////////////////////////////////////////////////v5pz/2MMa/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+3klf//////////////////////////////////////////////////////////////////////////////////////9fDD/9jDGf/p3Xz///////////////////////////////////////////////////////////////////////////////////////bxyP/ZxBv/6Nt1///////////////////////////////////////////////////////////////////////////////////////59tr/3Mkv/9rFIv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/axSH/6+CJ//378P///////////////////////////////////////////////////////////////////vz/8uqu/9zILv/ZxSD/2cQd/+ncef/8+uz////////////////////////////////////////////////////////////////////9//Lqr//cyS//2cUg/9nEHf/o3Hj//Prr/////////////////////////////////////////////////////////////////////v/07rv/3sw5/9nEHv/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYk/9jDG//ezDv/5thp/+3jkv/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kl//o3Hj/4M9I/9nEH//axSH/2sYn/9rGJf/Ywxv/3cs3/+XXZ//t45H/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jf/6dx6/+DQSv/ZxB//2cUh/9rGJ//axiX/2MMb/93LNv/l12X/7eKQ/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+ndfP/h0Ez/2sUi/9nFH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUh/9jDG//Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMa/9nEH//axiX/2sYm/9rGJv/axib/2sYm/9rFIv/Ywxv/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGv/ZxB//2sYl/9rGJv/axib/2sYm/9rGJv/axSL/2cQc/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxr/2cQf/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axibW2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibf2sYmX9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmcdrGJgDaxiaH2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmnNrGJgPaxiYA2sYmANrGJmHaxibR2sYm+trGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibX2sYmb9rGJgDaxiYAgAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAwAAAAAAAAAM=
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Wikidich%20Book%20Sync%20%28Refactored%29.user.js
// @downloadURL  https://github.com/BaoBao666888/Novel-Downloader5/raw/refs/heads/main/Wikidich%20Book%20Sync%20%28Refactored%29.user.js
// @match        https://truyenwikidich.net/truyen/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
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
    const SCRIPT_VERSION = '4.2.0';
    const logDebug = (...args) => { if (DEBUG) console.log(`[${SCRIPT_ID}]`, ...args); };

    const FANQIE_API_DEFAULT = 'https://rehaofan.jingluo.love';
    const DEFAULT_NEXT_CHAPTER_DELAY = 1500; // ms

    // Storage Prefixes
    const STORAGE_PREFIX = `${SCRIPT_ID}_`;
    const WIKI_LIST_PREFIX = `${STORAGE_PREFIX}wiki_list_`;
    const SOURCE_LIST_PREFIX = `${STORAGE_PREFIX}source_list_`;
    const PROCESS_STATUS_PREFIX = `${STORAGE_PREFIX}process_status_`;
    const SOURCE_URL_PREFIX = `${STORAGE_PREFIX}source_url_`;
    const CURRENT_ADAPTER_PREFIX = `${STORAGE_PREFIX}adapter_`;
    const IS_RUNNING_PREFIX = `${STORAGE_PREFIX}running_`;
    const DELAY_SETTING_PREFIX = `${STORAGE_PREFIX}delay_`;
    const ONLY_MISSING_MODE_PREFIX = `${STORAGE_PREFIX}only_missing_`;
    const MISSING_REGEX_PREFIX = `${STORAGE_PREFIX}missing_regex_`;
    // UI IDs
    const UI_PANEL_ID = `${SCRIPT_ID}-panel`;
    const UI_TOGGLE_ID = `${SCRIPT_ID}-toggle`;
    const UI_STATUS_ID = `${SCRIPT_ID}-status`;
    const UI_CHAPTER_LIST_ID = `${SCRIPT_ID}-chapter-list`;
    const UI_SOURCE_URL_INPUT_ID = `${SCRIPT_ID}-source-url`;
    const UI_LOAD_DATA_BTN_ID = `${SCRIPT_ID}-load-data`;
    const UI_RANGE_INPUT_ID = `${SCRIPT_ID}-range`;
    const UI_DELAY_INPUT_ID = `${SCRIPT_ID}-delay`;
    const UI_START_BTN_ID = `${SCRIPT_ID}-start`;
    const UI_STOP_BTN_ID = `${SCRIPT_ID}-stop`;
    const UI_CLEAR_HISTORY_BTN_ID = `${SCRIPT_ID}-clear`;
    const UI_CLOSE_BTN_ID = `${SCRIPT_ID}-close`;

    // --- Globals ---
    let FANQIE_API = FANQIE_API_DEFAULT; // Sẽ được cập nhật từ tokenOptions
    let currentBookInfo = null;
    let wikiChapters = [];
    let sourceChapters = [];
    let chapterStatus = {};
    let currentAdapter = null;
    let isSyncRunning = false;
    let syncQueue = [];
    let nextChapterDelay = DEFAULT_NEXT_CHAPTER_DELAY;

    let wikiInvalidChapters = [];
    let sourceInvalidChapters = [];

    // --- New Fanqie Content Fetcher Helpers ---
    function fanqie_fixQuotes(text) {
        if (!text || !/＂/.test(text)) return text;
        let normalized = text.replace(/[＂“”]/g, '"');
        let quoteCount = (normalized.match(/"/g) || []).length;
        if (quoteCount % 2 === 0) {
            let isOpen = true;
            return normalized.replace(/"/g, () => { const q = isOpen ? '“' : '”'; isOpen = !isOpen; return q; });
        }
        let isOpen = true;
        const lastQuoteIndex = Math.max(text.lastIndexOf('“'), text.lastIndexOf('”'));
        if (lastQuoteIndex !== -1) isOpen = text[lastQuoteIndex] === '”';
        return text.replace(/＂/g, () => { const q = isOpen ? '“' : '”'; isOpen = !isOpen; return q; });
    }

    function fanqie_generateCookie() {
        const base = 1000000000000000000;
        return "novel_web_id=" + (base * 6 + Math.floor(Math.random() * (base * 3)));
    }

    function fanqie_decodeText(text) {
        const CODE_ST = 58344, CODE_ED = 58715;
        const CHARSET = ['D', '在', '主', '特', '家', '军', '然', '表', '场', '4', '要', '只', 'v', '和', '?', '6', '别', '还', 'g', '现', '儿', '岁', '?', '?', '此', '象', '月', '3', '出', '战', '工', '相', 'o', '男', '首', '失', '世', 'F', '都', '平', '文', '什', 'V', 'O', '将', '真', 'T', '那', '当', '?', '会', '立', '些', 'u', '是', '十', '张', '学', '气', '大', '爱', '两', '命', '全', '后', '东', '性', '通', '被', '1', '它', '乐', '接', '而', '感', '车', '山', '公', '了', '常', '以', '何', '可', '话', '先', 'p', 'i', '叫', '轻', 'M', '士', 'w', '着', '变', '尔', '快', 'l', '个', '说', '少', '色', '里', '安', '花', '远', '7', '难', '师', '放', 't', '报', '认', '面', '道', 'S', '?', '克', '地', '度', 'I', '好', '机', 'U', '民', '写', '把', '万', '同', '水', '新', '没', '书', '电', '吃', '像', '斯', '5', '为', 'y', '白', '几', '日', '教', '看', '但', '第', '加', '候', '作', '上', '拉', '住', '有', '法', 'r', '事', '应', '位', '利', '你', '声', '身', '国', '问', '马', '女', '他', 'Y', '比', '父', 'x', 'A', 'H', 'N', 's', 'X', '边', '美', '对', '所', '金', '活', '回', '意', '到', 'z', '从', 'j', '知', '又', '内', '因', '点', 'Q', '三', '定', '8', 'R', 'b', '正', '或', '夫', '向', '德', '听', '更', '?', '得', '告', '并', '本', 'q', '过', '记', 'L', '让', '打', 'f', '人', '就', '者', '去', '原', '满', '体', '做', '经', 'K', '走', '如', '孩', 'c', 'G', '给', '使', '物', '?', '最', '笑', '部', '?', '员', '等', '受', 'k', '行', '一', '条', '果', '动', '光', '门', '头', '见', '往', '自', '解', '成', '处', '天', '能', '于', '名', '其', '发', '总', '母', '的', '死', '手', '入', '路', '进', '心', '来', 'h', '时', '力', '多', '开', '己', '许', 'd', '至', '由', '很', '界', 'n', '小', '与', 'Z', '想', '代', '么', '分', '生', '口', '再', '妈', '望', '次', '西', '风', '种', '带', 'J', '?', '实', '情', '才', '这', '?', 'E', '我', '神', '格', '长', '觉', '间', '年', '眼', '无', '不', '亲', '关', '结', '0', '友', '信', '下', '却', '重', '己', '老', '2', '音', '字', 'm', '呢', '明', '之', '前', '高', 'P', 'B', '目', '太', 'e', '9', '起', '稜', '她', '也','W', '用', '方', '子', '英', '每', '理', '便', '西', '数', '期', '中', 'C', '外', '样', 'a', '海', '们','任']
        let decodedText = "";
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (CODE_ST <= code && code <= CODE_ED) {
                decodedText += CHARSET[code - CODE_ST] || text[i];
            } else {
                decodedText += text[i];
            }
        }
        return decodedText;
    }

    function fanqie_htmlToText(html) {
        if (!html) return "";
        // 1. Thay thế </p> bằng 2 dấu xuống dòng để tạo khoảng cách giữa các đoạn.
        // 2. Thay thế <br> bằng 1 dấu xuống dòng.
        // 3. Xóa tất cả các thẻ HTML còn lại.
        let text = html
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '');
        // 4. Trim để xóa khoảng trắng thừa ở đầu và cuối.
        return text.trim();
    }

    // --- GM_xmlhttpRequest Wrapper for async/await ---
    function gmFetch(details) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                ...details,
                onload: (response) => resolve(response),
                onerror: (error) => reject(new Error(`GM_xmlhttpRequest error: ${error.error || 'Unknown'}`)),
                ontimeout: () => reject(new Error('GM_xmlhttpRequest timeout')),
            });
        });
    }

    // --- API Adapters ---
    const apiAdapters = {
        fanqie: {
            name: "Fanqie Novel",
            detect: (url) => /fanqienovel\.com\/(page|reader)\/\d+/.test(url),
            extractBookId: (url) => url.match(/fanqienovel\.com\/(?:page|reader)\/(\d+)/)?.[1],
            fetchDirectory: fetchFanqieDirectory,
            fetchContent: getChapterContentFromFanqie,
            requiresApi: true
        },
        shuba69: {
            name: "69shu吧 (69shuba)",
            detect: (url) => /69shu(?:ba)?\.(?:com|cx|net|org|pro|bar|ge|live|ink|me|cc|la|pt|io|art|id|shop|vip|click)\/(book\/\d+\/?(?:\.htm)?|txt\/\d+\/\d+)/.test(url),
            extractBookId: (url) => url.match(/69shu(?:ba)?\.[a-z0-9-]+\/(?:book|txt)\/(\d+)/)?.[1],
            fetchDirectory: fetch69ShubaDirectory,
            fetchContent: getChapterContentFrom69Shuba,
            requiresApi: false
        },
    };

    // --- Source Fetching Functions ---
    async function fetchFanqieDirectory(bookId, callback) {
        logToStatusUI('Đang tải danh sách chương Fanqie...');
        const directoryUrl = `https://fanqienovel.com/page/${bookId}`;
        try {
            const doc = await WikiChapterFetcher.Http.get(directoryUrl).html();
            const chapterEls = doc.querySelectorAll('.page-directory-content .chapter-item');
            if (!chapterEls || chapterEls.length === 0) {
                logToStatusUI('❌ Không tìm thấy chương Fanqie.', true); callback(null); return;
            }

            // --- BẮT ĐẦU THAY ĐỔI ---
            const validChapters = [];
            const invalidChapters = [];

            Array.from(chapterEls).forEach(el => {
                const linkEl = el.querySelector('a.chapter-item-title');
                const name = linkEl?.innerText?.trim();
                const href = linkEl?.getAttribute('href');

                if (!name || !href) return; // Bỏ qua nếu không có tên hoặc link

                const url = new URL(href, 'https://fanqienovel.com/').href;
                const numberMatch = name?.match(/(\d+)/); // Cố gắng lấy số chương từ tên
                const idMatch = href?.match(/reader\/(\d+)/);
                const isVip = !!el.querySelector('.chapter-item-lock');

                const number = numberMatch ? parseInt(numberMatch[1]) : null;
                const id = idMatch ? idMatch[1] : null;

                const chapterInfo = {
                    name,
                    url,
                    id,
                    isVip
                };

                // Nếu lấy được số và các thông tin cần thiết khác, cho vào danh sách hợp lệ
                if (number !== null && id && url) {
                    validChapters.push({ ...chapterInfo, number });
                } else {
                    // Nếu không, cho vào danh sách lỗi
                    invalidChapters.push(chapterInfo);
                }
            });


            if (validChapters.length === 0 && invalidChapters.length > 0) {
                logToStatusUI('⚠️ Không parse được chương Fanqie hợp lệ nào, chỉ có chương lỗi.', true);
            }

            validChapters.sort((a, b) => a.number - b.number);
            logToStatusUI(`✅ Tải xong ${validChapters.length} chương hợp lệ và ${invalidChapters.length} chương lỗi từ Fanqie.`);

            // Trả về một object chứa cả 2 danh sách
            callback({ valid: validChapters, invalid: invalidChapters });
            // --- KẾT THÚC THAY ĐỔI ---

        } catch (error) { logDebug("Error fetching Fanqie directory:", error); logToStatusUI(`❌ Lỗi tải DS Fanqie: ${error.message}`, true); callback(null); }
    }

    async function getChapterContentFromFanqie(sourceChapter) {
        const { id: chapId, url: chapterUrl, name: defaultTitle, isVip } = sourceChapter;
        logDebug(`Fetching Fanqie content for chapId: ${chapId}, isVip: ${isVip}`);

        function extractData(responseData, currentChapId) {
            let content = null, title = defaultTitle;
            if (!responseData) return { title, content };
            const R = responseData;
            content = R.content || R.data?.content || R.data?.data?.content || R.chapter?.content || R.text;
            if (!content && R.data?.[currentChapId]?.content) content = R.data[currentChapId].content;
            if (!content && R[currentChapId]?.content) content = R[currentChapId].content;
            if (typeof content === 'object' && content !== null && content.value) content = content.value;
            title = R.title || R.data?.title || R.data?.data?.title || R.chapter?.title || R.data?.[currentChapId]?.title || R[currentChapId]?.title || defaultTitle;
            if (content === "今日次数上限") content = "";
            return { title, content };
        }

        const apiConfigs = unsafeWindow.tokenOptions?.Fanqie;
        const doubiDomains = ["api.langge.cf", "api.doubi.tk", "20.langge.tk", "v2.dahuilang.cf", "vip.langge.cf:45800", "219.154.201.122:5006"];
        const isDoubiDomain = (url) => doubiDomains.some(domain => url.includes(domain));
        let apiList = [];
        const addedUrls = new Set();
        const addApiToList = (url, key) => {
            const finalUrl = url.toString();
            if (!addedUrls.has(finalUrl)) {
                apiList.push({ url: finalUrl, key: key });
                addedUrls.add(finalUrl);
            }
        };

        if (typeof apiConfigs === 'string' && apiConfigs.includes('{chapter_id}')) {
            addApiToList(apiConfigs.replace(/{chapter_id}/g, chapId));
        } else if (Array.isArray(apiConfigs)) {
            for (const item of apiConfigs) {
                if (!item?.url) continue;
                let userUrlStr = item.url.replace(/{chapter_id}/g, chapId);
                const u = new URL(userUrlStr, location.origin);
                if (isDoubiDomain(userUrlStr)) {
                    if (!u.searchParams.has('item_id')) u.searchParams.set('item_id', chapId);
                    u.searchParams.set('source', '番茄'); u.searchParams.set('tab', '小说'); u.searchParams.set('version', '4.6.29');
                }
                addApiToList(u.toString(), item.key);
            }
            const firstDoubiConfig = apiConfigs.find(item => item?.url && isDoubiDomain(item.url));
            if (firstDoubiConfig) {
                const template = new URL(firstDoubiConfig.url.replace(/{chapter_id}/g, chapId), location.origin);
                if (!template.searchParams.has('item_id')) template.searchParams.set('item_id', chapId);
                template.searchParams.set('source', '番茄'); template.searchParams.set('tab', '小说'); template.searchParams.set('version', '4.6.29');
                for (const domain of doubiDomains) {
                    const newUrl = new URL(template.toString());
                    const [hostname, port] = domain.split(':');
                    newUrl.hostname = hostname; newUrl.protocol = 'https:';
                    newUrl.port = port || '';
                    addApiToList(newUrl.toString(), firstDoubiConfig.key);
                }
            }
        }

        for (const { url, key } of apiList) {
            logDebug(`Fanqie: Thử API: ${url}`);
            try {
                const headers = {};
                if (isDoubiDomain(url)) {
                    if (!key) { logDebug(`Thiếu key (qttoken) cho API ${url}`); continue; }
                    headers.cookie = `qttoken=${key}`;
                }
                const res = await gmFetch({ method: 'GET', url, headers, responseType: 'json', timeout: 15000 });
                const { content } = extractData(res?.response, chapId);
                if (content) {
                    logDebug(`Fanqie: Thành công từ ${url}`);
                    return fanqie_fixQuotes(content);
                }
            } catch (e) { logDebug(`Fanqie: Lỗi từ ${url}:`, e.message); }
        }

        if (!isVip) {
            logDebug(`Fanqie: Thử fallback cho chương thường ${chapId}...`);
            try {
                const readerUrl = "https://fanqienovel.com/reader/" + chapId;
                const readerResp = await gmFetch({
                    method: "GET", url: readerUrl,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Safari/537.36",
                        "Cookie": fanqie_generateCookie()
                    },
                    responseType: 'text'
                });

                const html = readerResp.response;
                const contentMatch = html.match(/<div class="muye-reader-content.*?">(.*?)<\/div>/s);
                if (contentMatch && contentMatch[1]) {
                    // Bước 1: Lấy ra cục HTML
                    const rawHtml = contentMatch[1];
                    // Bước 2: Dùng hàm mới để chuyển HTML thành text có \n
                    const plainText = fanqie_htmlToText(rawHtml);
                    // Bước 3: Bây giờ mới giải mã các ký tự đặc biệt của Fanqie
                    const decodedContent = fanqie_decodeText(plainText);

                    logDebug("Fanqie: Fallback thành công!");
                    // Bước 4: Sửa dấu ngoặc kép và trả về như cũ
                    return fanqie_fixQuotes(decodedContent);
                }
            } catch (e) { logDebug("Fanqie: Fallback thất bại:", e); }
        }

        logToStatusUI(`❌ Fanqie: Không thể tải nội dung cho chương ${chapId}.`, true);
        return null;
    }

    async function fetch69ShubaDirectory(bookId, callback) {
        logToStatusUI('Đang tải danh sách chương 69shu吧...');
        const directoryUrl = `https://69shuba.cx/book/${bookId}/`;
        try {
            const doc = await WikiChapterFetcher.Http.get(directoryUrl, { overrideMimeType: 'text/html; charset=gbk' }).html();
            const chapterEls = doc.querySelectorAll('.mybox .catalog ul li a');
            if (!chapterEls || chapterEls.length === 0) {
                logToStatusUI('❌ Không tìm thấy chương nào trên 69shu吧.', true); callback(null); return;
            }

            // --- BẮT ĐẦU THAY ĐỔI ---
            let validChapters = [];
            let invalidChapters = [];

            const reversedEls = Array.from(chapterEls).reverse();
            reversedEls.forEach((el) => {
                const name = el.textContent?.trim();
                const relativeHref = el.getAttribute('href');
                if (!name || !relativeHref) return;

                const absoluteUrl = new URL(relativeHref, directoryUrl).href;
                const nameMatch = name.match(/^(?:第)?\s*(\d+)\s*(?:章|话|节|回|篇)/i) || name.match(/^(\d+)/);
                const number = nameMatch ? parseInt(nameMatch[1]) : null;

                if (number !== null) {
                    validChapters.push({ number, name, url: absoluteUrl, id: absoluteUrl });
                } else {
                    invalidChapters.push({ name, url: absoluteUrl });
                }
            });

            validChapters.sort((a, b) => a.number - b.number);
            logToStatusUI(`✅ Tải xong ${validChapters.length} chương hợp lệ và ${invalidChapters.length} chương không nhận diện được số từ 69shu吧.`);

            // Trả về object chứa cả 2 danh sách
            callback({ valid: validChapters, invalid: invalidChapters });
            // --- KẾT THÚC THAY ĐỔI ---

        } catch (error) { logDebug("Error fetching 69shu吧 directory:", error); logToStatusUI(`❌ Lỗi tải DS 69shu吧: ${error.message || error}`, true); callback(null); }
    }

    async function getChapterContentFrom69Shuba(sourceChapter) {
        const chapterUrl = sourceChapter.url;
        try {
            const doc = await WikiChapterFetcher.Http.get(chapterUrl, { overrideMimeType: 'text/html; charset=gbk' }).html();
            const contentElement = doc.querySelector('div.txtnav');
            if (!contentElement) return null;

            // Lấy tiêu đề gốc để so sánh và lọc sau này
            const titleElement = contentElement.querySelector('h1');
            const titleText = titleElement ? titleElement.textContent.trim() : '';

            // 1. Xóa thẻ div chứa thông tin ngày tháng/tác giả
            contentElement.querySelector('.txtinfo')?.remove();

            // 2. Xóa các thẻ script, quảng cáo...
            contentElement.querySelectorAll('script, style, iframe, .adsbygoogle, div[id*="ads"], div[class*="ads"], div[style*="text-align:center"], div:empty').forEach(el => el.remove());

            // 3. Xóa các div điều hướng
            Array.from(contentElement.querySelectorAll('div')).forEach(div => {
                const text = div.textContent.toLowerCase();
                if (text.includes("上一章") || text.includes("下一章") || text.includes("目录") || text.includes("書籤") || text.includes("温馨提示") || text.includes("69书吧")) {
                    div.remove();
                }
            });

            // Chuyển đổi HTML còn lại thành văn bản thuần túy
            let textOnly = extractTextOnly(contentElement.innerHTML);

            // 4. Lọc tiêu đề bị lặp ở dòng đầu
            if (titleText && textOnly.trim().startsWith(titleText)) {
                // Nếu dòng đầu của nội dung chính là tiêu đề, thì cắt bỏ nó đi
                textOnly = textOnly.trim().substring(titleText.length).trim();
            }


            return (textOnly && textOnly.trim().length > 0) ? textOnly : null;
        } catch (error) { logToStatusUI(`❌ Lỗi tải nội dung 69shu吧 (${chapterUrl.slice(-20)}): ${error.message || error}`, true); return null; }
    }

    // --- Utility Functions ---
    function getTimestamp() { return new Date().toLocaleTimeString(); }
    function getStorageKey(prefix, bookKey) { return `${prefix}${bookKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`; }
    async function saveToStorage(key, value) { try { await GM_setValue(key, JSON.stringify(value)); } catch (e) { logDebug(`Error saving to storage key ${key}:`, e); } }
    async function loadFromStorage(key, defaultValue = null) {
        const jsonValue = await GM_getValue(key, null); if (jsonValue === null) return defaultValue;
        try { return JSON.parse(jsonValue); } catch (e) { await GM_deleteValue(key); return defaultValue; }
    }
    function parseRange(rangeStr) {
        if (!rangeStr) return null;
        const [startStr, endStr] = rangeStr.trim().split('-');
        const start = parseInt(startStr);
        const end = (endStr && !isNaN(parseInt(endStr))) ? parseInt(endStr) : Infinity;
        return isNaN(start) ? null : { start, end };
    }
    async function initializeApiEndpoint() {
        const options = await (async (timeoutMs = 3000, intervalMs = 200) => {
            const startTime = Date.now();
            while (Date.now() - startTime < timeoutMs) {
                if (typeof unsafeWindow !== 'undefined' && unsafeWindow.tokenOptions) return unsafeWindow.tokenOptions;
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            }
            return null;
        })();
        if (options && options.Fanqie) { FANQIE_API = options.Fanqie; logDebug(`Using Fanqie API from tokenOptions`); }
    }
    function extractTextOnly(html) {
        const decoded = html.replace(/\\u003C/g, '<').replace(/\\u003E/g, '>').replace(/\\u0026/g, '&').replace(/\\"/g, '"');
        const doc = new DOMParser().parseFromString(decoded, 'text/html');
        let walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
        let textSegments = [];
        while (walker.nextNode()) {
            let text = walker.currentNode.nodeValue.trim();
            if (text) textSegments.push(text);
            else if (textSegments.length > 0 && textSegments[textSegments.length - 1] !== '') textSegments.push('');
        }
        return textSegments.join('\n');
    }
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // --- Wikidich Chapter Fetcher --- (Unchanged from original script)
    const WikiChapterFetcher = {
        signFunc: `function signFunc(r){function o(r,o){return r>>>o|r<<32-o}for(var f,n,t=Math.pow,c=t(2,32),i="length",a="",e=[],u=8*r[i],v=[],g=[],h=g[i],l={},s=2;64>h;s++)if(!l[s]){for(f=0;313>f;f+=s)l[f]=s;v[h]=t(s,.5)*c|0,g[h++]=t(s,1/3)*c|0}for(r+="\u0080";r[i]%64-56;)r+="\0";for(f=0;f<r[i];f++){if((n=r.charCodeAt(f))>>8)return;e[f>>2]|=n<<(3-f)%4*8}for(e[e[i]]=u/c|0,e[e[i]]=u,n=0;n<e[i];){var d=e.slice(n,n+=16),p=v;for(v=v.slice(0,8),f=0;64>f;f++){var w=d[f-15],A=d[f-2],C=v[0],F=v[4],M=v[7]+(o(F,6)^o(F,11)^o(F,25))+(F&v[5]^~F&v[6])+g[f]+(d[f]=16>f?d[f]:d[f-16]+(o(w,7)^o(w,18)^w>>>3)+d[f-7]+(o(A,17)^o(A,19)^A>>>10)|0);(v=[M+((o(C,2)^o(C,13)^o(C,22))+(C&v[1]^C&v[2]^v[1]&v[2]))|0].concat(v))[4]=v[4]+M|0}for(f=0;8>f;f++)v[f]=v[f]+p[f]|0}for(f=0;8>f;f++)for(n=3;n+1;n--){var S=v[f]>>8*n&255;a+=(16>S?0:"")+S.toString(16)}return a}`,
        Script: { execute: (fnStr, fnName, arg) => new Function(fnStr + `; return ${fnName};`)()(arg) },
        Http: { get: (url, requestOptions = {}) => ({ html: () => gmFetch({ method: "GET", url: url, ...requestOptions }).then(res => { const doc = new DOMParser().parseFromString(res.responseText, "text/html"); doc.html = () => res.responseText; return doc; }) }) },
        getAllChapters: async function (url) {
            const BASE_URL = 'https://truyenwikidich.net'; url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
            let doc = await this.Http.get(url).html(); const bookId = doc.querySelector("input#bookId")?.value; const html = doc.html();
            const size = html.match(/loadBookIndex.*?,\s*(\d+)/)?.[1] || 50; const signKey = html.match(/signKey\s*=\s*"(.*?)"/)?.[1]; const fuzzySign = html.match(/function fuzzySign[\s\S]*?}/)?.[0];
            if (!bookId || !signKey || !fuzzySign) throw new Error("Thiếu dữ liệu cần thiết để tải chương Wiki.");
            const genSign = (sk, cp, sz) => this.Script.execute(this.signFunc, "signFunc", this.Script.execute(fuzzySign, "fuzzySign", sk + cp + sz));
            const getChapterInPage = async (cp) => { const params = new URLSearchParams({ bookId, signKey, sign: genSign(signKey, cp, size), size, start: cp.toFixed(0) }); return await this.Http.get(`${BASE_URL}/book/index?${params}`).html(); };

            // --- BẮT ĐẦU THAY ĐỔI ---
            let currentPage = 0;
            const validChapters = []; // Chương có số
            const invalidChapters = []; // Chương không có số

            doc = await getChapterInPage(currentPage);
            while (doc) {
                const els = doc.querySelectorAll("li.chapter-name a, ul#chapters li a, a[href*='/chuong-']");
                for (const e of els) {
                    let link = e.getAttribute("href") || e.getAttribute("data-href");
                    if (link?.length >= 2) {
                        const name = e.textContent.trim();
                        let number = null;
                        const nameMatch = name.match(/(?:Chương|第|Đệ)\s*(\d+)/i);
                        const urlMatch = link.match(/\/chuong-(\d+)/i);
                        const absoluteUrl = link.startsWith('http') ? link : (link.startsWith('/') ? `${BASE_URL}${link}` : `${BASE_URL}/${link}`);

                        if (nameMatch?.[1]) number = parseInt(nameMatch[1]);
                        else if (urlMatch?.[1]) number = parseInt(urlMatch[1]);

                        if (number !== null) {
                            validChapters.push({ number, name, url: absoluteUrl, host: BASE_URL });
                        } else {
                            // Nếu không tìm thấy số, thêm vào danh sách lỗi
                            invalidChapters.push({ name, url: absoluteUrl });
                        }
                    }
                }
                const paginationLinks = doc.querySelectorAll("ul.pagination a[data-start]");
                const lastPage = paginationLinks.length > 0 ? parseInt(paginationLinks[paginationLinks.length - 1].getAttribute("data-start")) : 0;
                if (currentPage >= lastPage) break;
                currentPage += parseInt(size);
                doc = await getChapterInPage(currentPage);
            }
            // Trả về một object chứa cả 2 danh sách
            return { valid: validChapters, invalid: invalidChapters };
            // --- KẾT THÚC THAY ĐỔI ---
        }
    };

    // --- UI Functions ---
    function addStyles() {
        GM_addStyle(`
        #${UI_PANEL_ID} { position: fixed; bottom: 10px; right: 10px; width: 800px; max-width: 95vw; height: 75vh; background: #f9f9f9; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 9999; display: none; flex-direction: column; font-family: sans-serif; font-size: 13px; color: #333; resize: both; overflow: hidden; }
        #${UI_PANEL_ID} .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #eee; border-bottom: 1px solid #ccc; cursor: move; }
        #${UI_PANEL_ID} .panel-header h4 { margin: 0; font-size: 16px; color: #1a73e8; }
        #${UI_PANEL_ID} .panel-body { padding: 10px; overflow: hidden; display: flex; flex-direction: column; flex-grow: 1; }
        #${UI_PANEL_ID} .config-grid { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; margin-bottom: 10px; align-items: center; }
        #${UI_PANEL_ID} input[type="url"], #${UI_PANEL_ID} input[type="text"], #${UI_PANEL_ID} input[type="number"] { padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        #${UI_PANEL_ID} .control-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
        #${UI_PANEL_ID} .input-group { display: flex; align-items: center; gap: 5px; }
        #${UI_PANEL_ID} .input-group label { flex-shrink: 0; }
        #${UI_PANEL_ID} .input-group input { width: 100%; }
        #${UI_PANEL_ID} .button-group { display: flex; gap: 8px; justify-content: flex-end; }
        #${UI_PANEL_ID} button { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; background-color: #e0e0e0; transition: background-color 0.2s; }
        #${UI_PANEL_ID} button:hover:not(:disabled) { background-color: #d5d5d5; }
        #${UI_PANEL_ID} button:disabled { cursor: not-allowed; opacity: 0.6; }
        #${UI_PANEL_ID} button.primary { background-color: #1a73e8; color: white; }
        #${UI_PANEL_ID} button.primary:hover:not(:disabled) { background-color: #1565c0; }
        #${UI_PANEL_ID} button.start { background-color: #ff9800; color: white; }
        #${UI_PANEL_ID} button.start:hover:not(:disabled) { background-color: #f57c00; }
        #${UI_PANEL_ID} .chapter-list-container { flex: 1; display: flex; flex-direction: column; border: 1px solid #ddd; background: #fff; border-radius: 4px; min-height: 150px; overflow: hidden; }
        #${UI_PANEL_ID} .list-header { padding: 5px 8px; background: #f5f5f5; font-weight: bold; border-bottom: 1px solid #ddd; }
        #${UI_PANEL_ID} #${UI_CHAPTER_LIST_ID} { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex-grow: 1; }
        #${UI_PANEL_ID} #${UI_CHAPTER_LIST_ID} li { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-bottom: 1px solid #eee; font-size: 12px; white-space: nowrap; }
        #${UI_PANEL_ID} li .ch-num { width: 40px; text-align: right; color: #666; }
        #${UI_PANEL_ID} li .ch-name { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; }
        #${UI_PANEL_ID} li .ch-status-icons { display: flex; gap: 4px; font-size: 14px; }
        #${UI_PANEL_ID} li.status-processing { background-color: #fffde7; }
        #${UI_PANEL_ID} li.status-updated_hidden { background-color: #c8e6c9; }
        #${UI_PANEL_ID} li.status-checked_ok { background-color: #e3f2fd; } /* Xanh nước biển */
        #${UI_PANEL_ID} li.status-checked_ok { color: #888; }
        #${UI_PANEL_ID} li.status-error { background-color: #ffcdd2; }
        #${UI_PANEL_ID} li.status-skipped, #${UI_PANEL_ID} li.ch-missing { color: #bdbdbd; font-style: italic; }
        #${UI_PANEL_ID} .panel-footer { padding: 8px 12px; border-top: 1px solid #ccc; background: #eee; min-height: 80px; overflow-y: auto; white-space: pre-wrap; resize: vertical; }
        #${UI_TOGGLE_ID} { position: fixed; top: 150px; right: 0; background: #1a73e8; color: white; padding: 8px 5px; border: none; border-radius: 5px 0 0 5px; cursor: pointer; z-index: 9998; font-size: 18px; box-shadow: -2px 2px 5px rgba(0,0,0,0.2); }
        /* CSS for Comparison/Live Monitor Panel */
#${SCRIPT_ID}-compare-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    height: 80vh;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.25);
    z-index: 10001;
    display: none; /* Bắt đầu ẩn */
    flex-direction: column;
    resize: both; /* Cho phép thay đổi kích thước */
    overflow: hidden; /* Ngăn nội dung tràn ra ngoài khi resize */
}
#${SCRIPT_ID}-compare-panel .compare-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background: #f1f1f1;
    border-bottom: 1px solid #ddd;
    font-size: 16px;
    font-weight: bold;
    cursor: move; /* Cho phép kéo thả */
}
#${SCRIPT_ID}-compare-panel .compare-header-controls button {
    background: none; border: none; font-size: 24px; cursor: pointer; line-height: 1; padding: 0 5px;
}
#${SCRIPT_ID}-compare-panel .compare-body {
    display: flex;
    flex-grow: 1;
    overflow: hidden;
}
#${SCRIPT_ID}-compare-panel .compare-col {
    width: 50%;
    display: flex;
    flex-direction: column;
    padding: 10px;
    overflow-y: auto;
}
#${SCRIPT_ID}-compare-panel .compare-col:first-child { border-right: 1px solid #ddd; }
#${SCRIPT_ID}-compare-panel .compare-title {
    font-weight: bold; padding-bottom: 5px; border-bottom: 1px solid #eee; margin-bottom: 5px;
    background: #fafafa; padding: 8px; border-radius: 4px; font-family: sans-serif;
}
#${SCRIPT_ID}-compare-panel .compare-content {
    flex-grow: 1; white-space: pre-wrap; word-break: break-word; background: #fdfdfd;
    padding: 8px; font-family: monospace; font-size: 14px; line-height: 1.6;
}

#${SCRIPT_ID}-monitor-toggle-btn {
    position: fixed;
    top: 200px;
    right: 0;
    background: #ff9800; /* Màu cam */
    color: white;
    padding: 8px 5px;
    border: none;
    border-radius: 5px 0 0 5px;
    cursor: pointer;
    z-index: 9998;
    font-size: 18px;
    box-shadow: -2px 2px 5px rgba(0,0,0,0.2);
    display: none; /* Chỉ hiện khi đang chạy sync */
}
/* CSS for Help Modal */
#${SCRIPT_ID}-help-modal {
    display: none; /* Bắt đầu ẩn */
    position: fixed;
    z-index: 10002; /* Phải cao hơn tất cả các panel khác */
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.6); /* Nền mờ */
    overflow: auto;
}
#${SCRIPT_ID}-help-modal .help-modal-content {
    background-color: #fefefe;
    margin: 10% auto;
    padding: 20px;
    border: 1px solid #888;
    border-radius: 8px;
    width: 80%;
    max-width: 700px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    font-family: sans-serif;
    color: #333;
}
#${SCRIPT_ID}-help-modal .help-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
    margin-bottom: 15px;
}
#${SCRIPT_ID}-help-modal .help-modal-header h3 {
    margin: 0;
    color: #1a73e8;
}
#${SCRIPT_ID}-help-modal .help-modal-close {
    color: #aaa;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
}
#${SCRIPT_ID}-help-modal .help-modal-close:hover {
    color: #000;
}
#${SCRIPT_ID}-help-modal .help-modal-body h4 {
    margin-top: 20px;
    margin-bottom: 10px;
    color: #555;
}
#${SCRIPT_ID}-help-modal .help-modal-body pre {
    background-color: #f4f4f4;
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: monospace;
    font-size: 13px;
}
#${SCRIPT_ID}-help-modal .help-modal-body code {
    background: #e7e7e7;
    padding: 2px 4px;
    border-radius: 3px;
}
        `);
    }

    function createComparisonPanel() {
        if (document.getElementById(`${SCRIPT_ID}-compare-panel`)) return;
        const panel = document.createElement('div');
        panel.id = `${SCRIPT_ID}-compare-panel`;
        panel.innerHTML = `
            <div class="compare-header">
                <span id="${SCRIPT_ID}-compare-header-text">So sánh & Chỉnh sửa</span>
                <div class="compare-header-controls">
                    <button id="${SCRIPT_ID}-compare-hide-btn" title="Ẩn (không dừng)">—</button>
                    <button id="${SCRIPT_ID}-compare-close-btn" title="Đóng">×</button>
                </div>
            </div>
            <div class="compare-body">
                <div class="compare-col">
                    <h4>📖 Wikidich (Sửa ở đây)</h4>
                    <div class="compare-title">
                        <b>VN:</b> <span id="${SCRIPT_ID}-compare-wiki-title-vn">(Chưa tải)</span><br>
                        <b>CN:</b> <input type="text" id="${SCRIPT_ID}-compare-wiki-title-cn" placeholder="Tên chương Tiếng Trung" style="width: 98%; padding: 4px;">
                    </div>
                    <textarea id="${SCRIPT_ID}-compare-wiki-content" class="compare-content" placeholder="Nội dung Tiếng Trung..." style="height: 100%;"></textarea>
                    <button id="${SCRIPT_ID}-manual-save-btn" style="margin-top: 5px; padding: 8px; background-color: #4CAF50; color: white; border: none; cursor: pointer; font-weight: bold;">Lưu Thay Đổi (Vào Wikidich)</button>
                </div>
                <div class="compare-col">
                    <h4>☁️ Nguồn (<span id="${SCRIPT_ID}-compare-source-name"></span>) (Chỉ xem)</h4>
                    <div id="${SCRIPT_ID}-compare-source-title" class="compare-title">Chờ xử lý...</div>
                    <textarea id="${SCRIPT_ID}-compare-source-content" class="compare-content" readonly></textarea>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById(`${SCRIPT_ID}-manual-save-btn`)?.addEventListener('click', handleManualSave);

        // --- Event Listeners cho panel ---
        const header = panel.querySelector('.compare-header');
        document.getElementById(`${SCRIPT_ID}-compare-hide-btn`).addEventListener('click', () => {
            panel.style.display = 'none';
            if (isSyncRunning) document.getElementById(`${SCRIPT_ID}-monitor-toggle-btn`).style.display = 'block';
        });
        document.getElementById(`${SCRIPT_ID}-compare-close-btn`).addEventListener('click', () => {
            panel.style.display = 'none';
            document.getElementById(`${SCRIPT_ID}-monitor-toggle-btn`).style.display = 'none';
            if (isSyncRunning) handleStopSync();
        });

        // Kéo thả panel
        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            panel.style.cursor = 'grabbing';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.top = `${e.clientY - offsetY}px`;
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            panel.style.cursor = 'default';
        });
    }

    async function updateMonitorPanel(options = {}) {
        const panel = document.getElementById(`${SCRIPT_ID}-compare-panel`);
        if (!panel) return;

        // Lấy các element một lần
        const headerTextEl = document.getElementById(`${SCRIPT_ID}-compare-header-text`);
        const wikiTitleVnEl = document.getElementById(`${SCRIPT_ID}-compare-wiki-title-vn`);
        const wikiTitleCnInput = document.getElementById(`${SCRIPT_ID}-compare-wiki-title-cn`);
        const wikiContentArea = document.getElementById(`${SCRIPT_ID}-compare-wiki-content`);
        const sourceTitleEl = document.getElementById(`${SCRIPT_ID}-compare-source-title`);
        const sourceContentArea = document.getElementById(`${SCRIPT_ID}-compare-source-content`);
        const sourceNameEl = document.getElementById(`${SCRIPT_ID}-compare-source-name`);
        const saveBtn = document.getElementById(`${SCRIPT_ID}-manual-save-btn`);

        // Reset UI
        const resetUI = () => {
            headerTextEl.textContent = 'So sánh & Chỉnh sửa';
            wikiTitleVnEl.textContent = '(Chưa tải)';
            wikiTitleCnInput.value = '';
            wikiContentArea.value = '';
            sourceTitleEl.textContent = 'Chờ xử lý...';
            sourceContentArea.value = '';
            sourceNameEl.textContent = currentAdapter?.name || '...';
            saveBtn.disabled = true;
            delete saveBtn.dataset.editUrl;
        };

        if (options.reset) {
            resetUI();
            return;
        }

        // --- BẮT ĐẦU SỬA ---
        const { wikiChapter, sourceChapter, headerMessage, initialWikiContent, initialWikiNameCn, initialSourceContent } = options;

        if (headerMessage) {
            headerTextEl.textContent = headerMessage;
        } else {
            headerTextEl.textContent = `So sánh & Chỉnh sửa`;
        }

        // Xử lý Wiki
        if (wikiChapter) {
            wikiTitleVnEl.textContent = wikiChapter.name;
            const editUrl = `${wikiChapter.url.replace(/#.*$/, '')}/chinh-sua`;
            saveBtn.dataset.editUrl = editUrl;
            saveBtn.disabled = false;

            if (typeof initialWikiContent !== 'undefined') { // Nếu có nội dung sẵn
                wikiContentArea.value = initialWikiContent;
                // THÊM DÒNG NÀY ĐỂ HIỂN THỊ TÊN TIẾNG TRUNG
                if (typeof initialWikiNameCn !== 'undefined') {
                    wikiTitleCnInput.value = initialWikiNameCn;
                }
            } else { // Nếu không, tự đi lấy
                wikiTitleCnInput.value = 'Đang tải...';
                try {
                    const resp = await gmFetch({ method: 'GET', url: editUrl });
                    const doc = new DOMParser().parseFromString(resp.responseText, 'text/html');
                    const nameCn = doc.querySelector('#txtNameCn')?.value;
                    const content = doc.querySelector('#txtContentCn')?.value || '';
                    if (typeof nameCn === 'undefined') throw new Error("Không lấy được dữ liệu. Đã đăng nhập chưa?");
                    wikiTitleCnInput.value = nameCn;
                    wikiContentArea.value = content;
                } catch (e) {
                    wikiTitleCnInput.value = `Lỗi: ${e.message}`;
                    saveBtn.disabled = true;
                }
            }
        } else {
            wikiTitleVnEl.textContent = '(Không có)';
            wikiTitleCnInput.value = ''; wikiContentArea.value = ''; saveBtn.disabled = true;
        }

        // Xử lý Nguồn
        if (sourceChapter) {
            sourceTitleEl.textContent = `CN: ${sourceChapter.name}`;
            if (typeof initialSourceContent !== 'undefined') { // Nếu có nội dung sẵn
                sourceContentArea.value = initialSourceContent;
            } else { // Nếu không, tự đi lấy
                sourceContentArea.value = 'Đang tải...';
                try {
                    const sourceText = await currentAdapter.fetchContent(sourceChapter);
                    sourceContentArea.value = sourceText || '(Nội dung rỗng)';
                } catch (e) {
                    sourceContentArea.value = `Lỗi tải nội dung nguồn: ${e.message}`;
                }
            }
        } else {
            sourceTitleEl.textContent = '(Không có)'; sourceContentArea.value = '';
        }
        // --- KẾT THÚC SỬA ---
    }

    function createMainUI() {
        if (document.getElementById(UI_PANEL_ID)) return;
        const panel = document.createElement('div');
        panel.id = UI_PANEL_ID;
        panel.innerHTML = `
            <div class="panel-header">
                <h4>⚙️ Đồng bộ sách (v${SCRIPT_VERSION})</h4>
                <div>
                    <button id="${UI_STOP_BTN_ID}" title="Dừng" disabled style="color: #f44336;">⏹️</button>
                    <button id="${UI_CLOSE_BTN_ID}" title="Đóng" style="font-size: 20px;">×</button>
                </div>
            </div>
            <div class="panel-body">
                <div class="config-grid">
                    <input type="url" id="${UI_SOURCE_URL_INPUT_ID}" placeholder="Dán link nguồn (Fanqie, 69shuba...)" style="grid-column: 1 / -1;">
                </div>
                <div class="control-grid">
                    <div class="input-group">
                        <label for="${UI_RANGE_INPUT_ID}">Khoảng:</label>
                        <input type="text" id="${UI_RANGE_INPUT_ID}" placeholder="VD: 1-100 hoặc 50-">
                    </div>
                     <div class="input-group">
                        <label for="${UI_DELAY_INPUT_ID}">Delay (ms):</label>
                        <input type="number" id="${UI_DELAY_INPUT_ID}" value="${DEFAULT_NEXT_CHAPTER_DELAY}" min="200" step="100">
                    </div>
                </div>

                <div style="margin-bottom: 10px; padding: 8px; background: #f0f8ff; border-radius: 4px;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
        <input type="checkbox" id="${SCRIPT_ID}-only-missing-toggle" style="margin:0;">
        <label for="${SCRIPT_ID}-only-missing-toggle" style="font-weight: bold; cursor: pointer;">Chỉ thay thế chương thiếu nội dung</label>
    </div>
    <div style="display: flex; align-items: center; gap: 5px;">
        <input type="text" id="${SCRIPT_ID}-missing-regex" placeholder="Nhập Regex để nhận diện chương thiếu..." style="width: 100%;">
        <span id="${SCRIPT_ID}-regex-help-btn" style="cursor: help; font-size: 18px; color: #1a73e8;">?</span>
    </div>
</div>

                 <div class="control-grid">
                    <div class="button-group" style="justify-content: flex-start;">
                         <button id="${UI_LOAD_DATA_BTN_ID}" class="primary">1. Tải Dữ Liệu</button>
                    </div>
                    <div class="button-group">
                         <button id="${UI_CLEAR_HISTORY_BTN_ID}" title="Xóa lịch sử đồng bộ của sách này">🗑️ Xóa LS</button>
                         <button id="${UI_START_BTN_ID}" class="start" disabled>2. 🚀 Bắt đầu Sync</button>
                    </div>
                </div>
                <div class="chapter-list-container">
                    <div class="list-header">Danh sách chương (<span id="chapter-count">0</span>) | Nguồn: <span id="source-name">Chưa xác định</span></div>
                    <ul id="${UI_CHAPTER_LIST_ID}"><li><i>Chờ tải dữ liệu...</i></li></ul>
                </div>
                <details style="margin-top: 10px;">
                    <summary style="font-weight: bold; cursor: pointer;">Danh sách chương không khớp/lỗi (<span id="invalid-chapter-count">0</span>)</summary>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 200px; overflow-y: auto; background: #f5f5f5; padding: 5px; border: 1px solid #ddd;">
                        <div>
                            <h6>📖 Wikidich</h6>
                            <ul id="${SCRIPT_ID}-wiki-invalid-list" style="list-style: none; padding: 0; margin: 0;"></ul>
                        </div>
                        <div>
                            <h6>☁️ Nguồn</h6>
                            <ul id="${SCRIPT_ID}-source-invalid-list" style="list-style: none; padding: 0; margin: 0;"></ul>
                        </div>
                    </div>
                </details>
            </div>
            <div class="panel-footer" id="${UI_STATUS_ID}">Chờ thao tác...</div>
        `;
        document.body.appendChild(panel);

        // Event Listeners
        const handleCompareClick = async (target) => {
            const panel = document.getElementById(`${SCRIPT_ID}-compare-panel`);
            panel.style.display = 'flex';
            await updateMonitorPanel({ reset: true });

            let wikiChapter = null, sourceChapter = null;

            if (target.dataset.chapterNumber) { // Từ danh sách chính
                const chapterNumber = parseInt(target.dataset.chapterNumber);
                wikiChapter = wikiChapters.find(ch => ch.number === chapterNumber);
                sourceChapter = sourceChapters.find(ch => ch.number === chapterNumber);
            } else if (target.dataset.wikiUrl) { // Từ danh sách wiki lỗi
                wikiChapter = wikiInvalidChapters.find(ch => ch.url === target.dataset.wikiUrl);
            } else if (target.dataset.sourceUrl) { // Từ danh sách nguồn lỗi
                sourceChapter = sourceInvalidChapters.find(ch => ch.url === target.dataset.sourceUrl);
            }

            if (!wikiChapter && !sourceChapter) {
                alert('Không tìm thấy dữ liệu cho chương này.');
                return;
            }

            await updateMonitorPanel({ wikiChapter, sourceChapter });
        };

        // Gắn sự kiện cho cả 3 danh sách
        [UI_CHAPTER_LIST_ID, `${SCRIPT_ID}-wiki-invalid-list`, `${SCRIPT_ID}-source-invalid-list`].forEach(id => {
            document.getElementById(id)?.addEventListener('click', (e) => {
                const target = e.target.closest('.compare-btn');
                if (target) handleCompareClick(target);
            });
        });

        document.getElementById(UI_CLOSE_BTN_ID)?.addEventListener('click', () => {
            panel.style.display = 'none';
        });
        document.getElementById(UI_LOAD_DATA_BTN_ID)?.addEventListener('click', handleLoadData);
        document.getElementById(UI_START_BTN_ID)?.addEventListener('click', handleStartSync);
        document.getElementById(UI_STOP_BTN_ID)?.addEventListener('click', handleStopSync);
        document.getElementById(UI_CLEAR_HISTORY_BTN_ID)?.addEventListener('click', handleClearHistory);
        document.getElementById(UI_DELAY_INPUT_ID)?.addEventListener('change', (e) => {
            const delay = parseInt(e.target.value);
            if (!isNaN(delay) && delay >= 200) {
                nextChapterDelay = delay;
                saveToStorage(getStorageKey(DELAY_SETTING_PREFIX, currentBookInfo.key), delay);
            }
        });

        document.getElementById(`${SCRIPT_ID}-only-missing-toggle`)?.addEventListener('change', (e) => {
            saveToStorage(getStorageKey(ONLY_MISSING_MODE_PREFIX, currentBookInfo.key), e.target.checked);
        });
        document.getElementById(`${SCRIPT_ID}-missing-regex`)?.addEventListener('input', (e) => {
            saveToStorage(getStorageKey(MISSING_REGEX_PREFIX, currentBookInfo.key), e.target.value);
        });

        document.getElementById(`${SCRIPT_ID}-regex-help-btn`)?.addEventListener('click', () => {
            document.getElementById(`${SCRIPT_ID}-help-modal`).style.display = 'block';
        });

        // Event listener for compare buttons (using event delegation)


        // Load persisted settings
        loadFromStorage(getStorageKey(SOURCE_URL_PREFIX, currentBookInfo.key)).then(url => { if (url) document.getElementById(UI_SOURCE_URL_INPUT_ID).value = url; detectAdapter(url); updateUI(); });
        loadFromStorage(getStorageKey(`${STORAGE_PREFIX}last_range_`, currentBookInfo.key)).then(range => { if (range) document.getElementById(UI_RANGE_INPUT_ID).value = range; });
        loadFromStorage(getStorageKey(DELAY_SETTING_PREFIX, currentBookInfo.key)).then(delay => { if (delay) { document.getElementById(UI_DELAY_INPUT_ID).value = delay; nextChapterDelay = delay; } });
        loadFromStorage(getStorageKey(ONLY_MISSING_MODE_PREFIX, currentBookInfo.key), false).then(checked => {
            const toggle = document.getElementById(`${SCRIPT_ID}-only-missing-toggle`);
            if (toggle) toggle.checked = checked;
        });
        loadFromStorage(getStorageKey(MISSING_REGEX_PREFIX, currentBookInfo.key), '内容被隐藏了|nội dung bị ẩn').then(regex => {
            const input = document.getElementById(`${SCRIPT_ID}-missing-regex`);
            if (input) input.value = regex;
        });
    }

    function createHelpModal() {
        if (document.getElementById(`${SCRIPT_ID}-help-modal`)) return;

        const modal = document.createElement('div');
        modal.id = `${SCRIPT_ID}-help-modal`;
        modal.innerHTML = `
            <div class="help-modal-content">
                <div class="help-modal-header">
                    <h3>? Hướng dẫn Nhận diện Chương thiếu (Regex)</h3>
                    <span class="help-modal-close">&times;</span>
                </div>
                <div class="help-modal-body">
                    <p>
                        <strong>Mục đích:</strong> Tự động tìm những chương có nội dung bị ẩn hoặc bị lỗi trên Wikidich để thay thế bằng nội dung từ nguồn.
                    </p>

                    <h4>Cách dùng đơn giản (Phổ biến nhất)</h4>
                    <p>
                        <strong>1. Tìm kiếm một đoạn chữ cố định:</strong><br>
                        Cứ gõ thẳng đoạn chữ bạn muốn tìm vào.
                        <pre>nội dung bị ẩn</pre>
                    </p>
                    <p>
                        <strong>2. Tìm một trong nhiều đoạn chữ:</strong><br>
                        Dùng dấu gạch đứng <code>|</code> có nghĩa là "hoặc". Đây là cách dùng hiệu quả nhất.
                        <pre>nội dung bị ẩn|bị giới hạn|chương bị lỗi</pre>
                        <em>&rArr; Sẽ tìm chương nào chứa 1 trong 3 cụm từ trên.</em>
                    </p>

                    <h4>Cách dùng nâng cao (Tùy chọn)</h4>
                    <p>
                        <strong>- Dấu chấm <code>.</code> (Đại diện cho 1 ký tự bất kỳ):</strong>
                        <pre>còn ... trang</pre>
                        <em>&rArr; Sẽ khớp với "còn 5 trang", "còn 2 trang", v.v.</em>
                    </p>
                    <p>
                        <strong>- Dấu sao <code>*</code> (Đại diện cho 0 hoặc nhiều ký tự đứng trước):</strong>
                        <pre>còn khoảng.*chữ</pre>
                        <em>&rArr; Sẽ khớp với "còn khoảng 1842 chữ" hoặc "còn khoảng rất nhiều chữ".</em>
                    </p>
                    <p>
                        <strong>- Tìm chữ số <code>\\d</code>:</strong>
                        <pre>còn \\d{3,4} chữ</pre>
                        <em>&rArr; Sẽ khớp với 'còn' + (một số có 3 đến 4 chữ số) + 'chữ'.</em>
                    </p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Logic để đóng modal
        const closeBtn = modal.querySelector('.help-modal-close');
        function closeModal() { modal.style.display = 'none'; }

        closeBtn.onclick = closeModal;
        modal.onclick = function(event) {
            // Nếu click vào nền mờ (chính là modal) thì đóng
            if (event.target == modal) {
                closeModal();
            }
        };
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && modal.style.display === 'block') {
                closeModal();
            }
        });
    }

    function mergeChapterLists() {
        const chapterMap = new Map();
        wikiChapters.forEach(ch => chapterMap.set(ch.number, { number: ch.number, wiki: ch, source: null }));
        sourceChapters.forEach(ch => {
            if (chapterMap.has(ch.number)) {
                chapterMap.get(ch.number).source = ch;
            } else {
                chapterMap.set(ch.number, { number: ch.number, wiki: null, source: ch });
            }
        });
        return Array.from(chapterMap.values()).sort((a, b) => a.number - b.number);
    }

    function updateUI() {
        const panel = document.getElementById(UI_PANEL_ID);
        if (!panel || panel.style.display === 'none') return;

        const startBtn = document.getElementById(UI_START_BTN_ID);
        const stopBtn = document.getElementById(UI_STOP_BTN_ID);
        const loadBtn = document.getElementById(UI_LOAD_DATA_BTN_ID);
        document.getElementById('source-name').textContent = currentAdapter?.name || 'Chưa xác định';
        if (startBtn) startBtn.disabled = isSyncRunning || !wikiChapters.length || !sourceChapters.length;
        if (stopBtn) stopBtn.disabled = !isSyncRunning;
        if (loadBtn) loadBtn.disabled = isSyncRunning;
        document.querySelectorAll(`#${UI_PANEL_ID} input`).forEach((el) => {
            el.disabled = isSyncRunning;
        });

        const mergedChapters = mergeChapterLists();
        const listUl = document.getElementById(UI_CHAPTER_LIST_ID);
        document.getElementById('chapter-count').textContent = mergedChapters.length;
        listUl.innerHTML = '';

        if (mergedChapters.length === 0) {
            listUl.innerHTML = '<li><i>Danh sách trống. Vui lòng tải dữ liệu.</i></li>';
            return;
        }

        mergedChapters.forEach(ch => {
            const li = document.createElement('li');
            const status = chapterStatus[ch.number] || 'pending';
            li.className = `status-${status}`;
            li.dataset.chapterNumber = ch.number;

            const name = ch.wiki?.name || ch.source?.name || 'Không có tên';
            const wikiExists = !!ch.wiki;
            const sourceExists = !!ch.source;

            li.title = `Chương ${ch.number}: ${name}
Wiki: ${wikiExists ? '✔' : '❌'} | Nguồn: ${sourceExists ? '✔' : '❌'}
Trạng thái: ${status}`;

            li.innerHTML = `
    <span class="ch-num">${ch.number}</span>
    <span class="ch-status-icons">
        <span title="Có trên Wikidich">${wikiExists ? '📖' : '➖'}</span>
        <span title="Có ở Nguồn">${sourceExists ? '☁️' : '➖'}</span>
    </span>
    <span class="ch-name ${!wikiExists || !sourceExists ? 'ch-missing' : ''}">${name}</span>
    <button class="compare-btn" data-chapter-number="${ch.number}" title="So sánh nội dung chương ${ch.number}">🔍</button>
`;
            listUl.appendChild(li);
        });
        const populateInvalidList = (listId, chapters, type) => {
            const listUl = document.getElementById(listId);
            listUl.innerHTML = '';
            if (chapters.length === 0) {
                listUl.innerHTML = '<li><i>(Trống)</i></li>';
                return;
            }
            chapters.forEach((ch, index) => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.innerHTML = `
                    <span style="overflow: hidden; text-overflow: ellipsis;">${ch.name}</span>
                    <button class="compare-btn" data-${type}-url="${ch.url}" title="Xem & Sửa tay">✏️</button>
                `;
                listUl.appendChild(li);
            });
        };

        populateInvalidList(`${SCRIPT_ID}-wiki-invalid-list`, wikiInvalidChapters, 'wiki');
        populateInvalidList(`${SCRIPT_ID}-source-invalid-list`, sourceInvalidChapters, 'source');
        document.getElementById('invalid-chapter-count').textContent = wikiInvalidChapters.length + sourceInvalidChapters.length;
    }

    function logToStatusUI(message, isError = false) {
        const statusDiv = document.getElementById(UI_STATUS_ID);
        if (statusDiv) {
            const timestamp = `[${getTimestamp()}]`;
            statusDiv.textContent = `${timestamp} ${message}\n${statusDiv.textContent}`;
            statusDiv.style.color = isError ? '#d32f2f' : '#333';
        }
        if (DEBUG) { logDebug(isError ? 'ERROR:' : 'INFO:', message); }
    }

    async function processChapterDirect(chapterData, options = {}) {
        const chNum = chapterData.wiki.number;
        logToStatusUI(`🔁 Xử lý chương ${chNum}...`);
        const editUrl = `${chapterData.wiki.url.replace(/#.*$/, '')}/chinh-sua`;

        try {
            // --- Bước 1: Lấy nội dung hiện tại của Wiki ---
            const getResp = await gmFetch({ method: 'GET', url: editUrl });
            const doc = new DOMParser().parseFromString(getResp.responseText, 'text/html');
            const currentName = doc.querySelector('#txtNameCn')?.value; // Lấy tên CN
            const currentContent = doc.querySelector('#txtContentCn')?.value || '';

            if (typeof currentName === 'undefined') {
                throw new Error("Không lấy được tên chương. Đã đăng nhập chưa?");
            }

            // Cập nhật bảng giám sát với nội dung Wiki vừa lấy
            await updateMonitorPanel({
                wikiChapter: chapterData.wiki,
                sourceChapter: chapterData.source,
                headerMessage: `Ch. ${chNum} - Đang kiểm tra nội dung Wiki...`,
                initialWikiContent: currentContent,
                initialWikiNameCn: currentName // <-- Truyền tên CN vào
            });

            // --- Bước 2: KIỂM TRA nếu bật chế độ "Chỉ thay thế chương thiếu" ---
            if (options.onlyMissing && options.regex) {
                try {
                    const userRegex = new RegExp(options.regex, 'i');
                    if (!userRegex.test(currentContent)) {
                        logToStatusUI(`☑️ Chương ${chNum} đã đủ nội dung, bỏ qua.`);
                        chapterStatus[chNum] = 'checked_ok';
                        await saveChapterStatus();
                        await updateMonitorPanel({
                            wikiChapter: chapterData.wiki, sourceChapter: chapterData.source,
                            headerMessage: `Ch. ${chNum} - Hoàn tất (Đã đủ nội dung)`,
                            initialWikiContent: currentContent,
                            initialWikiNameCn: currentName // <-- Truyền tên CN vào
                        });
                        return;
                    }
                    logToStatusUI(`⚠️ Chương ${chNum} thiếu nội dung, tiến hành cập nhật.`);
                } catch (e) {
                    logToStatusUI(`❌ Regex không hợp lệ: "${options.regex}". Bỏ qua kiểm tra.`, true);
                }
            }

            // --- Bước 3: Lấy nội dung từ Nguồn ---
            const sourceText = await currentAdapter.fetchContent(chapterData.source);
            if (!sourceText) throw new Error("Adapter trả về nội dung rỗng từ nguồn.");

            // Cập nhật bảng giám sát với nội dung Nguồn
            await updateMonitorPanel({
                wikiChapter: chapterData.wiki, sourceChapter: chapterData.source,
                headerMessage: `Ch. ${chNum} - Đã có nội dung nguồn, chuẩn bị cập nhật...`,
                initialWikiContent: currentContent,
                initialWikiNameCn: currentName, // <-- Truyền tên CN vào
                initialSourceContent: sourceText
            });


            // --- Bước 4: Gửi yêu cầu cập nhật (PUT) ---
            const body = `nameCn=${encodeURIComponent(currentName)}&contentCn=${encodeURIComponent(sourceText)}`;
            const putResp = await gmFetch({
                method: 'PUT', url: editUrl, data: body,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Requested-With": "XMLHttpRequest",
                },
                responseType: 'json'
            });
            const putRespJson = putResp.response;

            // --- Bước 5: Xử lý kết quả ---
            if (putResp.status === 200 && putRespJson?.err === 0) {
                logToStatusUI(`✅ Chương ${chNum} cập nhật thành công.`);
                chapterStatus[chNum] = 'updated_hidden';
                await updateMonitorPanel({
                    wikiChapter: chapterData.wiki, sourceChapter: chapterData.source,
                    headerMessage: `Ch. ${chNum} - Hoàn tất (Đã cập nhật)`,
                    initialWikiContent: sourceText,
                    initialWikiNameCn: currentName, // <-- Truyền tên CN vào
                    initialSourceContent: sourceText
                });
            } else {
                throw new Error(`Lỗi server: ${JSON.stringify(putRespJson || { status: putResp.status, statusText: putResp.statusText }).slice(0, 200)}`);
            }
        } catch (err) {
            logToStatusUI(`❌ Lỗi chương ${chNum}: ${err.message}`, true);
            chapterStatus[chNum] = 'error';
            await updateMonitorPanel({
                wikiChapter: chapterData.wiki, sourceChapter: chapterData.source,
                headerMessage: `Ch. ${chNum} - Lỗi: ${err.message}`
            });
        }
        await saveChapterStatus();
    }

    function getBookInfo() {
        const title = document.querySelector('.cover-info h2')?.textContent?.trim() || 'Unknown Book';
        const bookId = document.querySelector("input#bookId")?.value || document.documentElement.innerHTML.match(/bookId['"]?\s*:\s*['"]?(\d+)['"]?/)?.[1];
        if (!bookId) { logToStatusUI("Lỗi: Không tìm thấy ID sách Wikidich.", true); return null; }
        const key = `${title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}_${bookId}`;
        return { id: bookId, title: title, key: key };
    }
    function detectAdapter(url) {
        if (!url) { currentAdapter = null; return null; }
        for (const key in apiAdapters) {
            const adapter = apiAdapters[key];
            if (adapter.detect(url)) {
                currentAdapter = adapter;
                saveToStorage(getStorageKey(CURRENT_ADAPTER_PREFIX, currentBookInfo.key), key);
                if (adapter.requiresApi) initializeApiEndpoint();
                return adapter;
            }
        }
        currentAdapter = null;
        return null;
    }
    async function loadPersistedData() {
        if (!currentBookInfo) return;
        wikiChapters = await loadFromStorage(getStorageKey(WIKI_LIST_PREFIX, currentBookInfo.key), []);
        sourceChapters = await loadFromStorage(getStorageKey(SOURCE_LIST_PREFIX, currentBookInfo.key), []);
        chapterStatus = await loadFromStorage(getStorageKey(PROCESS_STATUS_PREFIX, currentBookInfo.key), {});

        const savedAdapterKey = await loadFromStorage(getStorageKey(CURRENT_ADAPTER_PREFIX, currentBookInfo.key));
        if (savedAdapterKey && apiAdapters[savedAdapterKey]) {
            currentAdapter = apiAdapters[savedAdapterKey];
            if (currentAdapter.requiresApi) initializeApiEndpoint();
        } else if (document.getElementById(UI_SOURCE_URL_INPUT_ID).value) {
            detectAdapter(document.getElementById(UI_SOURCE_URL_INPUT_ID).value);
        }
        wikiChapters.forEach(ch => { if (!(ch.number in chapterStatus)) chapterStatus[ch.number] = 'pending'; });
        updateUI();
    }
    async function saveChapterStatus() {
        if (currentBookInfo) await saveToStorage(getStorageKey(PROCESS_STATUS_PREFIX, currentBookInfo.key), chapterStatus);
    }

    function findChapterData(chapterNumber) {
        const wikiChapter = wikiChapters.find(ch => ch.number === chapterNumber);
        const sourceChapter = sourceChapters.find(ch => ch.number === chapterNumber);
        if (!wikiChapter || !sourceChapter || !sourceChapter.id) return null;
        return { wiki: wikiChapter, source: sourceChapter };
    }

    // --- Button Handlers & Sync Control ---
    async function handleLoadData() {
        const btn = document.getElementById(UI_LOAD_DATA_BTN_ID); btn.disabled = true; btn.textContent = "Đang tải...";
        let success = true;

        // Reset danh sách lỗi
        wikiInvalidChapters = [];
        sourceInvalidChapters = [];

        // Fetch Wiki
        try {
            logToStatusUI("Đang tải DS chương Wikidich...");
            const wikiResult = await WikiChapterFetcher.getAllChapters(location.href);
            wikiChapters = wikiResult.valid;
            wikiInvalidChapters = wikiResult.invalid; // Lưu chương lỗi

            const newStatus = {};
            wikiChapters.forEach(ch => { newStatus[ch.number] = chapterStatus[ch.number] || 'pending'; });
            chapterStatus = newStatus;
            await saveToStorage(getStorageKey(WIKI_LIST_PREFIX, currentBookInfo.key), wikiChapters);
            await saveChapterStatus();
            logToStatusUI(`✅ Tải xong ${wikiChapters.length} chương hợp lệ và ${wikiInvalidChapters.length} chương lỗi từ Wikidich.`);
        } catch (error) { logToStatusUI(`❌ Lỗi tải DS Wiki: ${error.message}`, true); success = false; }

        // Fetch Source
        const url = document.getElementById(UI_SOURCE_URL_INPUT_ID)?.value?.trim();
        if (url) {
            const adapter = detectAdapter(url);
            if (adapter) {
                const sourceBookId = adapter.extractBookId(url);
                await saveToStorage(getStorageKey(SOURCE_URL_PREFIX, currentBookInfo.key), url);
                await new Promise(resolve => {
                    adapter.fetchDirectory(sourceBookId, async (result) => {
                        if (result && result.valid) {
                            sourceChapters = result.valid;
                            sourceInvalidChapters = result.invalid || []; // Lưu chương lỗi
                            await saveToStorage(getStorageKey(SOURCE_LIST_PREFIX, currentBookInfo.key), sourceChapters);
                        } else {
                            logToStatusUI(`⚠️ Không tải được chương nào từ ${adapter.name}.`, true);
                            success = false;
                        }
                        resolve();
                    });
                });
            } else { logToStatusUI("Link nguồn không được hỗ trợ.", true); success = false; }
        } else { logToStatusUI("Chưa nhập link nguồn.", true); success = false; }

        btn.disabled = false; btn.textContent = "1. Tải Dữ Liệu";
        updateUI();
    }

    async function handleStartSync() {
        if (isSyncRunning) return;
        const range = parseRange(document.getElementById(UI_RANGE_INPUT_ID)?.value);
        if (!range) { logToStatusUI("Khoảng chương không hợp lệ.", true); return; }
        if (!wikiChapters.length || !sourceChapters.length) { logToStatusUI("Cần tải dữ liệu trước.", true); return; }
        await saveToStorage(getStorageKey(`${STORAGE_PREFIX}last_range_`, currentBookInfo.key), document.getElementById(UI_RANGE_INPUT_ID).value);

        isSyncRunning = true;
        await GM_setValue(getStorageKey(IS_RUNNING_PREFIX, currentBookInfo.key), true);
        updateUI(); // Cập nhật UI để vô hiệu hóa các nút

        const queue = wikiChapters.map(ch => ch.number)
        .filter(num => num >= range.start && num <= range.end)
        .filter(num => ['pending', 'error'].includes(chapterStatus[num] || 'pending'))
        .filter(num => findChapterData(num) != null) // Ensure both wiki and source exist
        .sort((a, b) => a - b);

        if (queue.length === 0) {
            logToStatusUI(`Không có chương nào trong khoảng cần xử lý.`);
            isSyncRunning = false;
            await GM_setValue(getStorageKey(IS_RUNNING_PREFIX, currentBookInfo.key), false);
            updateUI();
            return;
        }

        logToStatusUI(`🚀 Bắt đầu đồng bộ ${queue.length} chương...`);
        const comparePanel = document.getElementById(`${SCRIPT_ID}-compare-panel`);
        if (comparePanel) comparePanel.style.display = 'flex';
        updateMonitorPanel({ reset: true });

        const onlyMissingEnabled = document.getElementById(`${SCRIPT_ID}-only-missing-toggle`).checked;
        const missingRegexStr = document.getElementById(`${SCRIPT_ID}-missing-regex`).value;
        const options = {
            onlyMissing: onlyMissingEnabled,
            regex: missingRegexStr
        };

        // Vòng lặp xử lý tuần tự
        for (const chapterNumber of queue) {
            if (!isSyncRunning) { // Kiểm tra nếu người dùng đã nhấn Dừng
                logToStatusUI("Hàng đợi đã bị dừng bởi người dùng.");
                break;
            }

            const chapterData = findChapterData(chapterNumber);
            if (!chapterData) {
                logToStatusUI(`❌ Bỏ qua chương ${chapterNumber}: Thiếu dữ liệu.`, true);
                chapterStatus[chapterNumber] = 'skipped';
                continue; // Bỏ qua và xử lý chương tiếp theo
            }

            // Đánh dấu đang xử lý và cập nhật UI
            chapterStatus[chapterNumber] = 'processing';
            await saveChapterStatus();
            const targetLi = document.querySelector(`#${UI_CHAPTER_LIST_ID} li[data-chapter-number="${chapterNumber}"]`);
            if (targetLi) {
                targetLi.className = 'status-processing';
                targetLi.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Xử lý chương
            await processChapterDirect(chapterData, options);

            // Cập nhật lại trạng thái cuối cùng trên UI
            const finalStatus = chapterStatus[chapterNumber] || 'error';
            if (targetLi) targetLi.className = `status-${finalStatus}`;


            if (isSyncRunning && queue.indexOf(chapterNumber) < queue.length - 1) {
                await delay(nextChapterDelay);
            }
        }

        if (isSyncRunning) { // Chỉ log "hoàn thành" nếu không phải do người dùng dừng
            logToStatusUI("🏁 Đã xử lý hết các chương trong hàng đợi.");
        }
        // Dừng tiến trình
        handleStopSync();
    }

    async function handleManualSave() {
        const btn = document.getElementById(`${SCRIPT_ID}-manual-save-btn`);
        const editUrl = btn.dataset.editUrl;
        if (!editUrl) {
            alert("Lỗi: Không tìm thấy URL của chương để sửa. Hãy chắc chắn bạn đã mở chương Wikidich hợp lệ.");
            logToStatusUI("Lỗi lưu tay: Thiếu editUrl.", true);
            return;
        }

        if (!confirm("Bạn có chắc muốn lưu thay đổi này lên máy chủ Wikidich?")) return;

        btn.disabled = true;
        btn.textContent = "Đang lưu...";

        try {
            const nameCn = document.getElementById(`${SCRIPT_ID}-compare-wiki-title-cn`).value;
            const contentCn = document.getElementById(`${SCRIPT_ID}-compare-wiki-content`).value;
            const body = `nameCn=${encodeURIComponent(nameCn)}&contentCn=${encodeURIComponent(contentCn)}`;
            const putResp = await gmFetch({
                method: 'PUT', url: editUrl, data: body,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Requested-With": "XMLHttpRequest",
                },
                responseType: 'json'
            });
            const putRespJson = putResp.response;
            if (putResp.status === 200 && putRespJson?.err === 0) {
                alert("Lưu thành công!");
                logToStatusUI(`✅ Lưu tay chương thành công: ${editUrl}`);
            } else {
                throw new Error(`Lỗi server: ${JSON.stringify(putRespJson || { status: putResp.status, statusText: putResp.statusText }).slice(0, 200)}`);
            }
        } catch (err) {
            alert(`Lưu thất bại: ${err.message}`);
            logToStatusUI(`❌ Lỗi lưu tay: ${err.message}`, true);
        } finally {
            btn.disabled = false;
            btn.textContent = "Lưu Thay Đổi (Vào Wikidich)";
        }
    }

    async function handleStopSync() {
        if (!isSyncRunning) return;
        logToStatusUI("⏹️ Đang dừng đồng bộ...");
        isSyncRunning = false;
        await GM_setValue(getStorageKey(IS_RUNNING_PREFIX, currentBookInfo.key), false);

        // Các dòng lỗi về `currentChapterProcessing` và `syncQueue` đã được xóa

        logToStatusUI("⏹️ Đồng bộ đã dừng.");
        document.getElementById(`${SCRIPT_ID}-monitor-toggle-btn`).style.display = 'none';
        updateUI();
    }

    async function handleClearHistory() {
        if (isSyncRunning) { logToStatusUI("Dừng đồng bộ trước khi xóa.", true); return; }
        if (confirm(`Xóa lịch sử đồng bộ cho sách "${currentBookInfo.title}"?`)) {
            chapterStatus = {}; wikiChapters.forEach(ch => { chapterStatus[ch.number] = 'pending'; });
            await saveChapterStatus(); logToStatusUI("🗑️ Đã xóa lịch sử."); updateUI();
        }
    }



    // --- Initialization ---
    async function initialize() {
        logDebug(`Script initializing (v${SCRIPT_VERSION})...`);
        const path = location.pathname;
        const isBookPage = path.match(/^\/truyen\/([^\/]+)$/) && !path.includes('/chuong-');
        if (!isBookPage) { logDebug("Not a target book page."); return; }

        currentBookInfo = getBookInfo();
        if (!currentBookInfo) { logDebug("Could not get book info. Aborting."); return; }

        addStyles();
        createMainUI();
        createComparisonPanel();
        createHelpModal();

        // Auto-detect source link from page description
        document.querySelectorAll('.book-desc a, .tab-content a').forEach(link => {
            if (Object.values(apiAdapters).some(adapter => adapter.detect(link.href))) {
                document.getElementById(UI_SOURCE_URL_INPUT_ID).value = link.href;
            }
        });
        await loadPersistedData();
        const wasRunning = await GM_getValue(getStorageKey(IS_RUNNING_PREFIX, currentBookInfo.key), false);
        if (wasRunning) {
            logDebug("Detected previous running state. Restarting sync...");
            if (await loadFromStorage(getStorageKey(`${STORAGE_PREFIX}last_range_`, currentBookInfo.key))) handleStartSync();
            else handleStopSync();
        }

        const toggleButton = document.createElement('button');
        toggleButton.id = UI_TOGGLE_ID; toggleButton.textContent = '⚙️';
        toggleButton.title = 'Hiện/Ẩn Bảng Đồng Bộ Sách';
        toggleButton.onclick = () => {
            const panel = document.getElementById(UI_PANEL_ID);
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
                if (panel.style.display === 'flex') updateUI();
            }
        };
        document.body.appendChild(toggleButton);
        GM_registerMenuCommand("Hiện/Ẩn Bảng Đồng Bộ Sách", () => toggleButton.click(), 's');
        const monitorToggleButton = document.createElement('button');
        monitorToggleButton.id = `${SCRIPT_ID}-monitor-toggle-btn`;
        monitorToggleButton.textContent = '👁️';
        monitorToggleButton.title = 'Hiện Bảng Giám Sát';
        monitorToggleButton.onclick = () => {
            document.getElementById(`${SCRIPT_ID}-compare-panel`).style.display = 'flex';
            monitorToggleButton.style.display = 'none';
        };
        document.body.appendChild(monitorToggleButton);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') initialize();
    else window.addEventListener('DOMContentLoaded', initialize, { once: true });

})();