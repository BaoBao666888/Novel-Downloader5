// ==UserScript==
// @name         Wikidich Works Manager
// @namespace    https://github.com/BaoBao666888/
// @version      0.5.2
// @description  Đồng bộ toàn bộ works cá nhân trên Wikidich, lưu vào localForage, hỗ trợ lọc nâng cao và xuất/nhập dữ liệu.
// @author       QuocBao
// @match        https://truyenwikidich.net/user/*/works*
// @match        https://truyenwikidich.net/truyen/*
// @match        https://koanchay.net/user/*/works*
// @match        https://koanchay.net/truyen/*
// @icon         data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAFgAAACgAAABAAAAAgAAAAAEAIAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAADaxiYA2sYmAdrGJnPaxibZ2sYm+9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibf2sYmgNrGJgbaxiYA2sYmAtrGJpzaxib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiaw2sYmCNrGJm3axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJn/axibd2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibl2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cUg/9jDG//Ywxr/2MMZ/9jDGf/Ywxr/2cQd/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSL/2cQd/9jDGv/Ywxn/2MMZ/9jDGf/Ywxv/2cQe/9rFI//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUi/9jDGv/Ywxr/28cp/+DORf/l12X/6dx6/+vgh//r4If/6Nt1/+PTVv/dyjT/2cQe/9jDGf/ZxB//2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cQd/9jDGf/ZxSD/3cs3/+PUWv/o3Hf/6+CH/+vgh//q3oH/5tls/+HRT//cyC7/2cQc/9jDGf/ZxSD/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/2MMa/93LN//n2nL/8eqt//n23P/+/vr//////////////////////////////////Prs//Xvw//r4In/4M9G/9nEHf/ZxB3/2sYm/9rGJP/Ywxr/2sYm/+LTVf/t45L/9vHI//377v//////////////////////////////////////+/jk//PtuP/p3n//381B/9nEHP/ZxB7/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/Ywxj/3sw7/+/moP/9++7///////////////////////////////////////////////////////////////////////7++f/z7bf/4dFN/9jCF//axiX/6d16//j01f////////////////////////////////////////////////////////////////////////////799f/y67L/4M9I/9jDGP/axiT/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nFIf/ZxR//6d19//z77P/////////////////////////////////////////////////////////////////////////////////////////////++//w56T/9/LN//////////////////////////////////////////////////////////////////////////////////////////////////799v/s4Yr/2sYj/9nEH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEH//byCz/8+yz//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Xww//dyzj/2cQc/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEHv/cyS//9/LN//////////////////////////////////////////////////389P/7+OT/+PXX//n12P/8+un////9///////////////////////////////////////////////////////////////////////////////9//z66//59tz/+PTV//r33//8++7/////////////////////////////////////////////////+vji/+HQSf/Zwxv/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nFIP/cyS//9/LN///////////////////////////////////////59tv/7eOS/+PUWv/ezDv/3Mgt/9rGJf/axib/3Mkx/+DQSf/p3Xr/9vHI//////////////////////////////////////////////////799f/z7LX/6Ntz/+DQSf/cyTL/28co/9rGJP/bxyr/3co1/+LSUP/r34X/9/PQ///////////////////////////////////////7+ej/385C/9nEHf/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/ZxR//9O68//////////////////////////////////r44v/o23X/28co/9jCGP/ZxBz/2cUh/9rGI//axiX/2sYk/9rFI//ZxB//2MMY/9nFIP/k1V//9vLL/////////////////////////////v76/+/mnv/fzT//2MMb/9jDGf/ZxB//2sUj/9rGJP/axiX/2sYk/9rFIv/ZxB7/2MMY/9rFIv/l1mP/+fXX//////////////////////////////////n12P/byCv/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/6t6B//////////////////////////////////Pstv/cyjL/2MMX/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMa/9rFIv/r4Ib//fvv////////////+fXY/+LSUf/Ywxf/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMZ/9vIKf/w6KX/////////////////////////////////8emr/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/380///788/////////////////////////////Hpqf/ZxB7/2cUg/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSH/2MMX//bwxf//////9e/A/9zJLf/Zwxv/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/2MMa/+zhiv/////////////////////////////////m2Gf/2cQa/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMa//Hpqf////////////////////////////PstP/ZxB7/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMZ/+3jkv//////9fDE/9rGJv/ZxR//2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/Ywxf/7uSW////////////////////////////+vfh/9vIKv/axiP/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUh/97MO//+/fX///////////////////////r44f/cyS7/2cUg/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+PTVf////7/+/jj/93KMv/ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYj/9nFHv/178H////////////////////////////p3Xv/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDGv/o3Hf////////////////////////////n2m//2MMY/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYl/9rFIv/388///////+TWYP/Ywxn/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/381A//388///////////////////////+PTS/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/8+y2///////////////////////59tv/2sYm/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSP/2cUh/9rFIv/axiX/2sYm/9nEG//m12b///////Pstf/Ywxr/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUj/9nFIf/ZxSL/2sYl/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDF//u5Zr//////////////////////////P/gz0j/2cUf/9rGJv/axib/2sYm/9rGJv/axiT/3Mgs//v45P//////////////////////7eKR/9jDGP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFI//Ywxv/3Mkv/97MPv/dyzf/2cQf/9nEHv/ZxB3/9e/C///////h0U7/2cQd/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiP/2MMa/9zILv/ezD7/3cs4/9nEH//ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/381A//799v//////////////////////6d5+/9jDGf/axib/2sYm/9rGJv/axib/2cQe/+HRTv////7//////////////////////+LSU//ZxB3/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFIv/bxyj/7uSW//v45P/+/fb//fvv//Tuu//fzkL/3co0///++//38sv/2cQe/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/28cn/+3jlP/7+OP//v32//378P/07r3/4dBK/9nEHP/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/28MX///////////////////////Lrs//ZxBv/2sYm/9rGJv/axib/2sYm/9jDGv/o23b///////////////////////z67P/cyjL/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSD/8+23////////////////////////////+/nl/+3jk///////6t5+/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2cUg//PstP////////////////////////////377//gz0X/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/7eKP///////////////////////59tz/28cn/9rGJP/axib/2sYm/9rGJv/Ywxn/7uSZ///////////////////////489D/2sUi/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/5tlr///////////////////////////////////////////////8/+HQSf/ZxR//2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+bYaP//////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYaf///////////////////////fzz/97MOv/axSH/2sYm/9rGJv/axib/2MMb//LqsP//////////////////////9O26/9jDHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe//XwxP////////////////////////////////////////////v55v/cyC3/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/177/////////////////////////////////////////+/P/gz0f/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i01T///////////////////////7++//fzkT/2cUg/9rGJv/axib/2sYm/9nEHf/07r////////////////////////Dopv/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUi/93LNv/9/PH////////////////////////////////////////////38s3/2sUh/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rFIv/dyjT//fvu////////////////////////////////////////////6dx5/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56H/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lD/////////////////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4dFO/////////////////////////////////////////////////+/mnf/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBz/5ddl//////////////////////////////////////////////////Ptuf/ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+XWY//////////////////////////////////////////////////z7LX/2cQb/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bZa//////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//n2Gn/////////////////////////////////////////////////9e68/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGP/axiX/2sYl/9rGJf/axiX/2sYl/9rGJf/Ywxr/5thq//////////////////////////////////////////////////Ptuf/YxBv/2sYl/9rGJf/axiX/2sYl/9rGJf/axiX/2MMa/+bXaP/////////////////////////////////////////////////07bv/2cQb/9rGJf/axiX/2sYl/9rGJf/axiX/2sYl/9nEHf/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/078D//////////////////////+/mn//XwRL/2cQf/9nEH//ZxB//2cQf/9nEH//ZxB//18EU/+XXZv/////////////////////////////////////////////////z7bf/18IV/9nEH//ZxB//2cQf/9nEH//ZxB//2cQf/9fBFP/l1mP/////////////////////////////////////////////////9O25/9jCFf/ZxB//2cQf/9nEH//ZxB//2cQf/9nEH//Ywhf/4dFO///////////////////////+/vv/385E/9nFIP/axib/2sYm/9rGJv/ZxBz/8+25///////////////////////7+ej/9fDE//bxyP/28cj/9vHI//bxyP/28cj/9vHI//Xwxf/59dn//////////////////////////////////////////////////Pvt//Xwxf/28cj/9vHI//bxyP/28cj/9vHI//bxyP/18MX/+fXZ//////////////////////////////////////////////////z77v/28MX/9vHI//bxyP/28cj/9vHI//bxyP/28cj/9vDG//j00////////////////////////v73/9/NP//ZxSH/2sYm/9rGJv/axib/2MMZ/+zijf/////////////////////////////////////////////////////////////////////////////////////////////////+/ff//////////////////////////////////////////////////////////////////////////////////////////////////v33//////////////////////////////////////////////////////////////////////////////////////////////////n22//bxib/2sYk/9rGJv/axib/2sYm/9nEHv/i0U/////+////////////////////////////////////////////////////////////////////////////////////////////7eOT//z66////////////////////////////////////////////////////////////////////////////////////////////+7klv/7+eb////////////////////////////////////////////////////////////////////////////////////////////v5pz/2MMa/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+3klf//////////////////////////////////////////////////////////////////////////////////////9fDD/9jDGf/p3Xz///////////////////////////////////////////////////////////////////////////////////////bxyP/ZxBv/6Nt1///////////////////////////////////////////////////////////////////////////////////////59tr/3Mkv/9rFIv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/axSH/6+CJ//378P///////////////////////////////////////////////////////////////////vz/8uqu/9zILv/ZxSD/2cQd/+ncef/8+uz////////////////////////////////////////////////////////////////////9//Lqr//cyS//2cUg/9nEHf/o3Hj//Prr/////////////////////////////////////////////////////////////////////v/07rv/3sw5/9nEHv/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYk/9jDG//ezDv/5thp/+3jkv/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kl//o3Hj/4M9I/9nEH//axSH/2sYn/9rGJf/Ywxv/3cs3/+XXZ//t45H/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jf/6dx6/+DQSv/ZxB//2cUh/9rGJ//axiX/2MMb/93LNv/l12X/7eKQ/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+ndfP/h0Ez/2sUi/9nFH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUh/9jDG//Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMa/9nEH//axiX/2sYm/9rGJv/axib/2sYm/9rFIv/Ywxv/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGv/ZxB//2sYl/9rGJv/axib/2sYm/9rGJv/axSL/2cQc/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxr/2cQf/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axibW2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibf2sYmX9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmcdrGJgDaxiaH2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmnNrGJgPaxiYA2sYmANrGJmHaxibR2sYm+trGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibX2sYmb9rGJgDaxiYAgAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAwAAAAAAAAAM=
// @run-at       document-idle
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TruyenWikiDich_Works_Manager.user.js
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TruyenWikiDich_Works_Manager.user.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js
// ==/UserScript==

/* global localforage */
(function() {
    'use strict';

    const VERSION = '0.3.0';
    const ALLOWED_HOSTNAMES = ['truyenwikidich.net', 'koanchay.net']
    const FILTER_RESULT_LIMIT = 500;
    const STORE_VERSION = 1;
    const DELAY = 1400;
    const MAX_RETRIES = 10; // Số lần thử lại tối đa
    const RETRY_DELAY = 5000; // Thời gian chờ giữa các lần thử lại (3 giây)
    const STORE_CFG = {
        name: 'wdWorksCache',
        storeName: 'snapshots',
        description: 'Works cache for offline filtering'
    };

    const BROADCAST_PREFIX = 'wdwm:';
    const ORIGIN_ID = Math.random().toString(36).slice(2);
    let broadcastWarned = false;

    const TEXT = {
        needSync: 'Chưa có dữ liệu. Nhấn "Đồng bộ" để tải toàn bộ works.',
        syncRunning: 'Đồng bộ đang chạy, vui lòng đợi…',
        syncDone: 'Đồng bộ hoàn tất. Đừng quên xuất dữ liệu dự phòng.',
        syncAbort: 'Đã dừng đồng bộ theo yêu cầu.',
        exportDone: 'Đã xuất dữ liệu JSON.',
        importDone: 'Nhập dữ liệu thành công.',
        importInvalid: 'File không hợp lệ (sai username/phiên bản).',
        noCache: 'Chưa có dữ liệu để thao tác.',
        manualAdded: 'Đã thêm/cập nhật truyện thủ công.',
        manualRemoved: 'Đã xóa truyện khỏi cache.'
    };

    const state = {
        username: null,
        mode: null,
        basePath: null,
        baseQuery: null,
        key: null,
        cache: null,
        syncing: false,
        abort: false,
        overlay: null,
        panel: null,
        fileInput: null,
        filterModal: null,
        channel: null,
        channelName: null,
        hasInitialFilter: false,
        isPausedByCloudflare: false
    };
    const norm = (text = '') => text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const fmtNum = (value) => Number.isFinite(value) ? new Intl.NumberFormat('vi-VN').format(value) : '';
    const fmtDate = (val) => {
        if (!val) return '';
        // val có thể là Date hoặc string (ISO hoặc 'YYYY-MM-DD')
        let d;
        if (val instanceof Date) {
            d = val;
        } else {
            const s = String(val);
            d = new Date(s.includes('T') ? s : `${s}T00:00:00Z`);
        }
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN');
    };
    const fmtDuration = (ms) => {
        if (!ms || ms <= 0) return '';
        const totalSeconds = Math.round(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes ? `${minutes}p ${seconds}s` : `${seconds}s`;
    };
    const parseVNDate = (text) => {
        if (!text) return null;
        const m = text.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (!m) return null;
        return `${m[3]}-${m[2]}-${m[1]}`;
    };
    const parseAbbr = (raw) => {
        if (!raw) return null;
        const upper = raw.trim().toUpperCase();
        const match = upper.match(/([0-9]+(?:\.[0-9]+)?)([KMB]?)/);
        if (!match) {
            const plain = Number(upper.replace(/[^0-9]/g, ''));
            return Number.isNaN(plain) ? null : plain;
        }
        let value = parseFloat(match[1]);
        if (Number.isNaN(value)) return null;
        const suffix = match[2];
        if (suffix === 'K') value *= 1_000;
        else if (suffix === 'M') value *= 1_000_000;
        else if (suffix === 'B') value *= 1_000_000_000;
        return Math.round(value);
    };

    const Http = {
        get: (url) => ({
            html: async () => {
                const res = await fetch(url, {
                    credentials: 'include',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const html = await res.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                doc.html = () => html;
                return doc;
            },
        }),
    };

    const Script = {
        execute: (fnStr, fnName, arg) => {
            // Tạo hàm một cách an toàn
            const fn = new Function(fnStr + `; return ${fnName};`)();
            return fn(arg);
        }
    };

    const detectContext = () => {
        const url = new URL(window.location.href);
        url.hash = '';
        const parts = url.pathname.split('/').filter(Boolean);
        const idx = parts.indexOf('user');
        if (idx === -1 || idx + 1 >= parts.length) return null;
        const username = decodeURIComponent(parts[idx + 1]);
        const mode = parts[idx + 2] || 'works';
        const basePath = `/user/${encodeURIComponent(username)}/${mode}`;
        const baseQuery = new URLSearchParams(url.search);
        baseQuery.delete('start');
        return { username, mode, basePath, baseQuery };
    };

    const getCurrentUser = (doc) => {
        // Lấy link trong menu user
        const profileLink = doc.querySelector('nav .nav-wrapper #ddUser a[href^="/user/"]');
        if (profileLink) {
            const href = profileLink.getAttribute('href');
            const parts = href.split('/').filter(Boolean); // ['user','nguy%E1%BB%85n-b%E1%BA%A3o233']
            const slug = parts[1] || '';
            return decodeURIComponent(slug); // --> 'nguyễn-bảo233'
        }
        return null;
    };

    const askSyncOptions = () => {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.id = 'wd-works-sync-options';
            dialog.style.cssText = 'position:fixed;inset:0;background:rgba(5,10,15,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;color:#fff;font-family:Segoe UI,sans-serif;';
            dialog.innerHTML = `
            <style>
                .sync-option {
                    border: 1px solid transparent;
                    transition: background-color 0.2s, border-color 0.2s;
                }
                .sync-option:has(input:checked) {
                    background-color: rgba(57, 197, 255, 0.1) !important;
                    border-color: #39c5ff;
                }
            </style>
            <div style="background:#101722;padding:22px;border-radius:14px;min-width:420px;text-align:left;box-shadow:0 16px 36px rgba(0,0,0,.35);">
                <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;">Tùy chọn đồng bộ</h3>
                <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
                    <label class="sync-option" style="display:flex; align-items:center; gap:8px; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; cursor:pointer;">
                        <input type="radio" name="sync-mode" value="full_no_summary" checked style="width:18px; height:18px; accent-color:#39c5ff; pointer-events:none;">
                        <div>
                            <strong style="color:#fff;">Đồng bộ nhanh (Không văn án)</strong>
                            <div style="font-size:12px; opacity:0.8;">Quét lại danh sách truyện và thông tin cơ bản. Tốc độ nhanh nhất.</div>
                        </div>
                    </label>
                    <label class="sync-option" style="display:flex; align-items:center; gap:8px; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; cursor:pointer;">
                        <input type="radio" name="sync-mode" value="full_with_summary" style="width:18px; height:18px; accent-color:#39c5ff; pointer-events:none;">
                        <div>
                            <strong style="color:#fff;">Đồng bộ đầy đủ (Kèm văn án)</strong>
                            <div style="font-size:12px; opacity:0.8;">Quét tất cả thông tin, bao gồm cả văn án. Sẽ mất nhiều thời gian hơn.</div>
                        </div>
                    </label>

                    <label class="sync-option" style="display:flex; align-items:center; gap:8px; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; cursor:pointer;">
                        <input type="radio" name="sync-mode" value="summary_only" style="width:18px; height:18px; accent-color:#39c5ff; pointer-events:none;">
                        <div>
                            <strong style="color:#fff;">Chỉ đồng bộ văn án</strong>
                            <div style="font-size:12px; opacity:0.8;">Chỉ tải văn án cho các truyện chưa có. Hữu ích khi danh sách truyện đã đủ.</div>
                        </div>
                    </label>

                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top:16px;">
                     <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                         <div>
                             <label for="sync-threads" style="font-size:12px; opacity:0.8; margin-bottom:4px; display:block;">Số luồng</label>
                             <input id="sync-threads" type="number" value="1" min="1" max="5" style="width:100%; padding: 7px 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; border-radius: 6px; font-size: 13px;">
                         </div>
                         <div>
                             <label for="sync-delay" style="font-size:12px; opacity:0.8; margin-bottom:4px; display:block;">Delay (ms)</label>
                             <input id="sync-delay" type="number" value="1500" min="500" step="100" style="width:100%; padding: 7px 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; border-radius: 6px; font-size: 13px;">
                         </div>
                     </div>
                </div>
                <div class="controls" style="margin-top:20px; text-align:right; display:flex; justify-content:flex-end; gap:10px;">
                     <button data-action="cancel" style="background:rgba(255,255,255,0.12);border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;">Hủy</button>
                     <button data-action="start" style="background:#39c5ff;border:none;color:#0b1220;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;">Bắt đầu</button>
                </div>
            </div>`;

            dialog.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-action]');
                const action = button ? button.dataset.action : null;

                const label = e.target.closest('.sync-option');
                if (label) {
                    const radio = label.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                    }
                }

                if (action === 'cancel') {
                    dialog.remove();
                    resolve(null);
                } else if (action === 'start') {
                    const mode = dialog.querySelector('input[name="sync-mode"]:checked').value;
                    const threads = parseInt(dialog.querySelector('#sync-threads').value, 10) || 1;
                    const delay = parseInt(dialog.querySelector('#sync-delay').value, 10) || 1500;
                    dialog.remove();
                    resolve({ mode, threads, delay });
                }
            });

            document.body.appendChild(dialog);
        });
    };

    const ensureOverlay = () => {
        if (state.overlay) return state.overlay;
        const wrap = document.createElement('div');
        wrap.id = 'wd-works-overlay';
        wrap.style.cssText = 'position:fixed;inset:0;background:rgba(5,10,15,0.78);display:flex;align-items:center;justify-content:center;z-index:99998;color:#fff;font-family:Segoe UI,sans-serif;';
        wrap.innerHTML = `
            <div style="background:#101722;padding:22px;border-radius:14px;min-width:320px;text-align:center;box-shadow:0 16px 36px rgba(0,0,0,.35);">
                <div class="msg" style="font-size:15px;font-weight:600;margin-bottom:12px;">Đang đồng bộ…</div>
                <div class="bar" style="width:100%;height:6px;background:rgba(255,255,255,0.15);border-radius:999px;overflow:hidden;">
                    <span style="display:block;height:100%;width:0;background:linear-gradient(90deg,#39c5ff,#4bffdc);transition:width .2s;"></span>
                </div>
                <div class="meta" style="margin-top:10px;font-size:12px;opacity:.85;"></div>
                <div class="controls" style="margin-top:16px;">
                     <button data-action="stop" style="background:rgba(246,78,96,0.28);border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;">Dừng</button>
                     <button data-action="resume" style="display:none; background:#39c5ff;border:none;color:#0b1220;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;">Tiếp tục</button>
                </div>
            </div>`;

        wrap.querySelector('button[data-action="stop"]').addEventListener('click', () => {
            state.abort = true;
            state.isPausedByCloudflare = false;
        });

        wrap.querySelector('button[data-action="resume"]').addEventListener('click', () => {
            state.isPausedByCloudflare = false;

            // Khôi phục lại giao diện đồng bộ ngay lập tức
            updateOverlay({ text: 'Đang tiếp tục đồng bộ...', meta: 'Đã nhận tín hiệu, tiếp tục quét...' });

            const overlay = ensureOverlay(); // Lấy lại chính nó để thao tác
            overlay.querySelector('.bar').style.display = 'block';
            overlay.querySelector('.controls button[data-action="stop"]').style.display = 'inline-block';
            overlay.querySelector('.controls button[data-action="resume"]').style.display = 'none';
        });

        document.body.appendChild(wrap);
        state.overlay = wrap;
        return wrap;
    };

    const updateOverlay = ({ text, progress, meta }) => {
        const overlay = ensureOverlay();
        const msg = overlay.querySelector('.msg');
        const bar = overlay.querySelector('.bar span');
        const metaEl = overlay.querySelector('.meta');
        if (text) msg.textContent = text;
        if (typeof progress === 'number') bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        if (meta !== undefined) metaEl.textContent = meta || '';
    };

    const hideOverlay = () => {
        if (state.overlay) {
            state.overlay.remove();
            state.overlay = null;
        }
    };

    const ensurePanel = () => {
        if (state.panel) return state.panel;
        const panel = document.createElement('div');
        panel.id = 'wd-works-panel';

        panel.style.cssText = 'position:fixed;bottom:80px;right:20px;z-index:99997;background:rgba(17,25,34,0.92);color:#fff;padding:12px 14px;border-radius:10px;min-width:240px;font-family:Segoe UI,sans-serif;font-size:12px;box-shadow:0 12px 30px rgba(0,0,0,0.25);';

        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong style="font-size:13px;">Works Manager</strong>
                <button data-action="toggle" style="background:none;border:none;color:#fff;font-size:16px;line-height:1;cursor:pointer;">+</button>
            </div>
            <div class="summary" style="line-height:1.6; display:none;"></div>
            <div class="actions" style="display:none; flex-wrap:wrap;gap:6px;margin-top:10px;"></div>
            <div class="msg" style="margin-top:8px;opacity:.8; display:none;"></div>`;

        const btnStyle = 'flex:1 1 48%;background:rgba(255,255,255,0.16);border:none;color:#fff;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:12px;';
        const actions = [
            ['sync', 'Đồng bộ'],
            ['export', 'Xuất'],
            ['import', 'Nhập'],
            ['filter', 'Lọc'],
            ['add', 'Thêm tay'],
            ['clear', 'Xóa cache']
        ];
        const actionsEl = panel.querySelector('.actions');
        actions.forEach(([action, label]) => {
            const btn = document.createElement('button');
            btn.dataset.action = action;
            btn.textContent = label;
            btn.style.cssText = btnStyle + (action === 'clear' ? ';background:rgba(246,78,96,0.28);' : '');
            actionsEl.appendChild(btn);
        });

        panel.dataset.collapsed = '1';

        panel.addEventListener('click', (event) => {
            const target = event.target.closest('button[data-action]');
            if (!target) return;
            event.stopPropagation();
            const action = target.dataset.action;

            if (action === 'toggle') {
                const isCollapsed = panel.dataset.collapsed === '1';
                panel.dataset.collapsed = isCollapsed ? '0' : '1';

                if (isCollapsed) { // Nếu đang thu gọn -> Mở ra
                    panel.querySelector('.summary').style.display = ''; // Dùng '' để quay về mặc định (block)
                    panel.querySelector('.actions').style.display = 'flex'; // Khôi phục ĐÚNG display: flex
                    panel.querySelector('.msg').style.display = '';
                    target.textContent = '–';
                } else { // Nếu đang mở -> Thu gọn
                    panel.querySelector('.summary').style.display = 'none';
                    panel.querySelector('.actions').style.display = 'none';
                    panel.querySelector('.msg').style.display = 'none';
                    target.textContent = '+';
                }

                return;
            }

            if (action === 'sync') handleSync();
            else if (action === 'export') handleExport();
            else if (action === 'import') handleImport();
            else if (action === 'filter') openFilter();
            else if (action === 'add') handleManualAdd();
            else if (action === 'clear') handleClear();
        });
        document.body.appendChild(panel);
        state.panel = panel;
        return panel;
    };

    const panelSummary = () => ensurePanel().querySelector('.summary');
    const panelMessage = () => ensurePanel().querySelector('.msg');
    const setMessage = (text) => { panelMessage().textContent = text || ''; };

    const notify = (text, isError = false) => {
        try {
            GM_notification({ title: 'Works Manager', text, timeout: 4000 });
        } catch (_) {
            // ignore
        }
        if (isError) console.warn('[WorksManager]', text);
        else console.log('[WorksManager]', text);
        setMessage(text);
    };

    const ensureFileInput = () => {
        if (state.fileInput) return state.fileInput;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.style.display = 'none';
        input.addEventListener('change', async (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            try {
                const json = JSON.parse(await file.text());
                if (!json || json.username !== state.username || json.version !== STORE_VERSION) {
                    notify(TEXT.importInvalid, true);
                    return;
                }
                await saveCache(json);
                notify(TEXT.importDone);
                updateSummary();
            } catch (err) {
                console.error('[WorksManager] import', err);
                notify('Không thể nhập dữ liệu.', true);
            } finally {
                event.target.value = '';
            }
        });
        document.body.appendChild(input);
        state.fileInput = input;
        return input;
    };
    const saveCache = async (data) => {
        await localforage.setItem(state.key, data);
        state.cache = data;
    };

    const loadCache = async () => {
        state.cache = await localforage.getItem(state.key);
    };

    const updateSummary = () => {
        const summary = panelSummary();
        if (!state.cache) {
            summary.innerHTML = TEXT.needSync;
            setMessage('');
            return;
        }
        const total = state.cache.bookIds.length;
        summary.innerHTML = `Tổng: <strong>${fmtNum(total)}</strong> truyện<br>` +
            `Đồng bộ: <strong>${fmtDate(state.cache.syncedAt)}</strong><br>` +
            `Thời gian chạy: <strong>${fmtDuration(state.cache.durationMs)}</strong>`;
        const currentTotal = readTotal(document);
        if (currentTotal && currentTotal > total) {
            setMessage(`Có ${fmtNum(currentTotal - total)} truyện mới. Hãy đồng bộ lại!`);
        } else {
            setMessage('');
        }
    };

    const readTotal = (doc) => {
        const node = doc.querySelector('.book-count');
        if (!node) return null;
        const value = Number(node.textContent.replace(/[^0-9]/g, ''));
        return Number.isNaN(value) ? null : value;
    };

    const parseBook = (node) => {
        try {
            const checkbox = node.querySelector('input[name="bookId"]');
            const id = checkbox ? checkbox.value.trim() : null;
            if (!id) return null;
            const titleAnchor = node.querySelector('.book-title');
            const title = titleAnchor ? titleAnchor.textContent.trim() : '';
            const url = titleAnchor ? new URL(titleAnchor.getAttribute('href'), window.location.origin).href : null;
            const cover = node.querySelector('.book-cover img');
            const coverUrl = cover ? new URL(cover.getAttribute('src'), window.location.origin).href : null;
            const authorNodes = node.querySelectorAll('.book-author');
            let author = '';
            let status = '';
            const tags = [];
            authorNodes.forEach((p, index) => {
                const text = p.textContent.trim();
                const href = p.querySelector('a')?.getAttribute('href') || '';
                if (index === 0) author = text;
                else if (href.includes('status=')) status = text;
                else if (text) tags.push(text);
            });
            const stats = {};
            node.querySelectorAll('.book-stats').forEach((span) => {
                const icon = span.querySelector('i');
                const valueNode = span.querySelector('[data-ready]') || span;
                const raw = valueNode.textContent.trim();
                if (!icon) return;
                const iconName = icon.classList.contains('material-icons') ? icon.textContent.trim() : icon.className;
                if (iconName === 'visibility') stats.views = parseAbbr(raw);
                else if (iconName === 'star') stats.rating = parseAbbr(raw);
                else if (iconName.includes('fa-comment')) stats.comments = parseAbbr(raw);
            });
            const extra = node.querySelector('.book-info-extra');
            let chapters = null;
            let updated = null;
            if (extra) {
                const chapter = extra.querySelector('.book-chapter-count');
                if (chapter) {
                    const value = Number(chapter.textContent.replace(/[^0-9]/g, ''));
                    chapters = Number.isNaN(value) ? null : value;
                }
                const lastUpdate = extra.querySelector('.book-last-update');
                if (lastUpdate) updated = parseVNDate(lastUpdate.textContent);
            }
            return {
                id,
                title,
                url,
                coverUrl,
                author,
                status,
                statusNorm: norm(status),
                titleNorm: norm(title),
                authorNorm: norm(author),
                tags,
                stats,
                chapters,
                updated,
                updatedText: updated ? fmtDate(updated) : '',
                collectedAt: new Date().toISOString(),
                collections: [],
                flags: {
                    poster: false,
                    managerOwner: false,
                    managerGuest: false,
                    editorOwner: false,
                    editorGuest: false,
                    private: false,
                    embedLink: false,
                    embedFile: false,
                    duplicate: false,
                    vip: false
                }
            };
        } catch (err) {
            console.error('[WorksManager] parseBook', err);
            return null;
        }
    };
    const extractFromDocument = (doc) => {
        const container = doc.querySelector('.book-list');
        if (!container) return { list: [], total: null, pageSize: 0 };
        const nodes = Array.from(container.querySelectorAll(':scope > .book-info'));
        return {
            list: nodes.map(parseBook).filter(Boolean),
            total: readTotal(doc),
            pageSize: nodes.length
        };
    };

    const fetchDocument = async (start, extraParams = null) => {
        let finalUrl;

        // KIỂM TRA "CHỈ THỊ ĐẶC BIỆT"
        if (extraParams && extraParams.overrideUrl) {
            finalUrl = extraParams.overrideUrl; // Nếu có, dùng trực tiếp URL này
        } else {
            // Nếu không, hoạt động như cũ
            const url = new URL(state.basePath, window.location.origin);
            if (extraParams) {
                Object.entries(extraParams).forEach(([key, value]) => {
                    url.searchParams.set(key, value);
                });
            }
            if (start > 0) url.searchParams.set('start', String(start));
            finalUrl = url.href;
        }


        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // Nếu đang bị tạm dừng, chờ ở đây
                while (state.isPausedByCloudflare) {
                    if (state.abort) throw new Error('Đã dừng đồng bộ theo yêu cầu.');
                    await sleep(500); // Chờ 0.5s rồi kiểm tra lại
                }

                const response = await fetch(finalUrl, { // Dùng finalUrl thay vì url.href
                    credentials: 'include',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                let htmlContent = await response.text();
                const isCloudflareChallenge = response.status === 403 || htmlContent.includes('cdn-cgi/challenge-platform');

                if (isCloudflareChallenge) {
                    console.warn('[WorksManager] Phát hiện Cloudflare. Tạm dừng và chờ người dùng xác nhận.');
                    state.isPausedByCloudflare = true;

                    GM_openInTab(window.location.origin, { active: true });

                    const overlay = ensureOverlay();
                    updateOverlay({
                        text: 'Yêu cầu xác thực',
                        meta: 'Đã mở một tab mới. Vui lòng giải quyết CAPTCHA (nếu có) và chờ trang tải xong. Sau đó, quay lại đây và nhấn "Tiếp tục".'
                    });
                    overlay.querySelector('.bar').style.display = 'none';
                    overlay.querySelector('.controls button[data-action="stop"]').style.display = 'none';
                    overlay.querySelector('.controls button[data-action="resume"]').style.display = 'inline-block';

                    // Chờ vòng lặp tiếp theo kiểm tra lại state.isPausedByCloudflare
                    attempt--; // Không tính đây là một lần thử lại thất bại
                    continue;
                }

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return new DOMParser().parseFromString(htmlContent, 'text/html');

            } catch (err) {
                if (state.abort) throw err; // Nếu người dùng đã bấm dừng, ném lỗi ra ngay
                console.warn(`[WorksManager] Lỗi khi tải trang (thử lại ${attempt}/${MAX_RETRIES}):`, err.message);
                if (attempt >= MAX_RETRIES) throw err;
                await sleep(RETRY_DELAY);
            }
        }
    };

    const addUnique = (arr, value) => {
        if (!value) return;
        if (!arr.includes(value)) arr.push(value);
    };

    const fetchIdsForTask = async (task) => {
        const ids = new Set();
        let start = 0;
        let total = Infinity;
        let pageSize = null;
        while (start === 0 || start < total) {
            if (state.abort) throw new Error(TEXT.syncAbort);
            const doc = await fetchDocument(start, task.params);
            const data = extractFromDocument(doc);
            data.list.forEach((book) => ids.add(book.id));
            if (data.total !== null && data.total !== undefined) total = data.total;
            pageSize = data.pageSize || pageSize || 10;
            if (!pageSize || pageSize <= 0) break;
            start += pageSize;
            if (start >= total) break;
            await sleep(DELAY);
        }
        return ids;
    };

    const fetchAllBooksForTask = async (task) => {
        const books = [];
        const seenIds = new Set();
        let start = 0;
        let total = Infinity;
        let pageSize = null;
        while (start === 0 || start < total) {
            if (state.abort) throw new Error(TEXT.syncAbort);
            const doc = await fetchDocument(start, task.params);
            const data = extractFromDocument(doc);
            data.list.forEach((book) => {
                if (book && !seenIds.has(book.id)) {
                    books.push(book);
                    seenIds.add(book.id);
                }
            });
            if (data.total !== null && data.total !== undefined) total = data.total;
            pageSize = data.pageSize || pageSize || 10;
            if (!pageSize || pageSize <= 0) break;
            start += pageSize;
            if (start >= total) break;
            await sleep(DELAY);
        }
        return books;
    };

    const handleExport = () => {
        if (!state.cache) {
            notify(TEXT.noCache, true);
            return;
        }
        try {
            const blob = new Blob([JSON.stringify(state.cache, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wikidich-works-${state.username}-${state.mode}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
            notify(TEXT.exportDone);
        } catch (err) {
            console.error('[WorksManager] export', err);
            notify('Xuất dữ liệu thất bại.', true);
        }
    };

    const handleImport = () => {
        ensureFileInput().click();
    };

    const handleClear = async () => {
        if (!state.cache) {
            notify(TEXT.noCache, true);
            return;
        }
        if (!window.confirm('Xóa toàn bộ cache works hiện có?')) return;
        await localforage.removeItem(state.key);
        state.cache = null;
        notify('Đã xóa cache.');
        updateSummary();
    };

    const handleManualRemove = async (bookId) => {
        if (!state.cache || !state.cache.books[bookId]) {
            notify('Truyện không tồn tại trong cache.', true);
            return;
        }
        const bookTitle = state.cache.books[bookId].title;
        if (!window.confirm(`Bạn có chắc muốn xóa "${bookTitle}" khỏi cache?`)) return;

        state.cache.bookIds = state.cache.bookIds.filter(id => id !== bookId);
        delete state.cache.books[bookId];

        await saveCache(state.cache);
        notify(TEXT.manualRemoved);
        updateSummary();

        if (state.channel) {
            state.channel.postMessage({ origin: ORIGIN_ID, type: 'remove', bookId: bookId, title: bookTitle });
        }
    };

    // Hàm mới: dùng để lấy số chương chính xác bằng cách gọi API
    const fetchAccurateChapterCount = async (doc, bookId) => {
        try {
            const BASE_URL = window.location.origin;
            const html = doc.documentElement.innerHTML;
            const size = html.match(/loadBookIndex.*?,\s*(\d+)/)?.[1] || 50;
            const signKey = html.match(/signKey\s*=\s*"([^"]+)"/)?.[1];
            const fuzzySign = html.match(/function fuzzySign[\s\S]*?}/)?.[0];

            if (!bookId || !signKey || !fuzzySign) {
                console.warn('[WorksManager] Thiếu thông tin để tải danh sách chương từ API.');
                return null;
            }

            // GIỮ NGUYÊN signFunc gốc, không thay đổi
            const signFunc = `function signFunc(r){function o(r,o){return r>>>o|r<<32-o}for(var f,n,t=Math.pow,c=t(2,32),i="length",a="",e=[],u=8*r[i],v=[],g=[],h=g[i],l={},s=2;64>h;s++)if(!l[s]){for(f=0;313>f;f+=s)l[f]=s;v[h]=t(s,.5)*c|0,g[h++]=t(s,1/3)*c|0}for(r+="";r[i]%64-56;)r+="\\0";for(f=0;f<r[i];f++){if((n=r.charCodeAt(f))>>8)return;e[f>>2]|=n<<(3-f)%4*8}for(e[e[i]]=u/c|0,e[e[i]]=u,n=0;n<e[i];){var d=e.slice(n,n+=16),p=v;for(v=v.slice(0,8),f=0;64>f;f++){var w=d[f-15],A=d[f-2],C=v[0],F=v[4],M=v[7]+(o(F,6)^o(F,11)^o(F,25))+(F&v[5]^~F&v[6])+g[f]+(d[f]=16>f?d[f]:d[f-16]+(o(w,7)^o(w,18)^w>>>3)+d[f-7]+(o(A,17)^o(A,19)^A>>>10)|0);(v=[M+((o(C,2)^o(C,13)^o(C,22))+(C&v[1]^C&v[2]^v[1]&v[2]))|0].concat(v))[4]=v[4]+M|0}for(f=0;8>f;f++)v[f]=v[f]+p[f]|0}for(f=0;8>f;f++)for(n=3;n+1;n--){var S=v[f]>>8*n&255;a+=(16>S?0:"")+S.toString(16)}return a}`;

            const genSign = (signKey, currentPage, size) => {
                return Script.execute(signFunc, "signFunc",
                                      Script.execute(fuzzySign, "fuzzySign", signKey + currentPage + size)
                                     );
            }

            const getChapterInPage = async (currentPage) => {
                const params = new URLSearchParams({
                    bookId: bookId,
                    signKey: signKey,
                    sign: genSign(signKey, currentPage, size),
                    size: size,
                    start: currentPage.toFixed(0)
                });
                console.log(`Link: ${BASE_URL}/book/index?${params}`);
                return await Http.get(`${BASE_URL}/book/index?${params}`).html();
            }

            let totalChapters = 0;
            let currentPage = 0;
            let docPage = await getChapterInPage(currentPage);

            while (docPage) {
                const els = docPage.querySelectorAll("li.chapter-name a");
                totalChapters += els.length;

                const paginationLinks = docPage.querySelectorAll("ul.pagination a[data-start]");
                if (paginationLinks.length === 0) break;

                const lastPageStart = parseInt(paginationLinks[paginationLinks.length - 1].getAttribute("data-start"), 10);
                if (currentPage >= lastPageStart) break;

                currentPage += parseInt(size, 10);
                docPage = await getChapterInPage(currentPage);
            }

            return totalChapters;
        } catch (err) {
            console.error('[WorksManager] Lỗi khi lấy số chương chính xác bằng API:', err);
            return null; // Trả về null nếu có lỗi
        }
    };

    const parseBookFromPage = async (doc, bookId, bookUrl, currentUser) => {
        try {
            const info = doc.querySelector('.cover-info');
            if (!info) throw new Error('Không tìm thấy khối .cover-info');
            console.log('[parseBookFromPage] .cover-info:', info);

            const title = info.querySelector('h2')?.textContent.trim() || '';
            console.log('[parseBookFromPage] title:', title);

            const coverEl = doc.querySelector('.cover-wrapper img');
            const coverUrl = coverEl ? new URL(coverEl.src, window.location.origin).href : null;
            const findP = (keyword) =>
            Array.from(info.querySelectorAll('p')).find(p =>
                                                        norm(p.textContent).replace(/\s+/g, ' ').includes(keyword)
                                                       );
            const findPByXPath = () => {
                try {
                    const xp = './/p[contains(normalize-space(.), "Thời gian đổi mới")]';
                    const ctx = info || doc;
                    const res = (doc.evaluate || document.evaluate).call(
                        doc, xp, ctx, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
                    );
                    return res.singleNodeValue || null;
                } catch (_) {
                    return null;
                }
            };

            const pTime = findP('thoi gian doi moi') || findPByXPath();
            console.log('[parseBookFromPage] pTime outerHTML:', pTime ? pTime.outerHTML : null);

            const getTextFromP = (p) => {
                if (!p) return '';
                // Ưu tiên <span>, nếu không có thì lấy phần sau dấu ':' (chấp nhận cả ':' và '：')
                const spanTxt = p.querySelector('span')?.textContent?.trim();
                if (spanTxt) return spanTxt;
                const raw = p.textContent.replace(/\u00A0/g, ' ')
                .replace(/：/g, ':');
                return raw.split(':').slice(1).join(':').trim();
            };

            const updatedTextRaw = getTextFromP(pTime);
            console.log('[parseBookFromPage] updatedText raw:', updatedTextRaw);

            // --- PARSE date (cover dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, kèm hh:mm[:ss]) ---
            const updated = (() => {
                const s0 = (updatedTextRaw || '').trim();
                if (!s0) return null;

                // Chuẩn hoá: '-', '.' -> '/', gom khoảng trắng
                const t = s0.replace(/[.\-]/g, '/').replace(/\s+/g, ' ');

                // 1) dd/mm/yyyy [hh:mm[:ss]]
                let m = t.match(
                    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
                );
                if (m) {
                    const [, d, mo, y, hh = '00', mm = '00', ss = '00'] = m;
                    const dt = new Date(+y, +mo - 1, +d, +hh, +mm, +ss);
                    return isNaN(+dt) ? null : dt;
                }

                // 2) yyyy/mm/dd [hh:mm[:ss]] (trường hợp server trả 2025-09-21 ...)
                m = t.match(
                    /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
                );
                if (m) {
                    const [, y, mo, d, hh = '00', mm = '00', ss = '00'] = m;
                    const dt = new Date(+y, +mo - 1, +d, +hh, +mm, +ss);
                    return isNaN(+dt) ? null : dt;
                }

                // 3) Fallback: bắt cụm dd/mm/yyyy ở bất kỳ đâu
                m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (m) {
                    const [, d, mo, y] = m;
                    const dt = new Date(+y, +mo - 1, +d);
                    return isNaN(+dt) ? null : dt;
                }
                return null;
            })();

            console.log('[parseBookFromPage] updated parsed:', updated);
            const getLinkTextFromP = (p) => p?.querySelector('a')?.textContent.trim() || getTextFromP(p);
            const author = getLinkTextFromP(findP('tac gia'));
            const status = getLinkTextFromP(findP('tinh trang'));
            console.log('[parseBookFromPage] author:', author, 'status:', status, 'updated:', updated);

            const stats = {};
            info.querySelectorAll('.book-stats').forEach(span => {
                const icon = span.querySelector('i');
                const raw = (span.querySelector('[data-ready]') || span).textContent.trim();
                if (!icon) return;
                const iconName = icon.classList.contains('material-icons') ? icon.textContent.trim() : icon.className;
                if (iconName === 'visibility') stats.views = parseAbbr(raw);
                else if (iconName === 'star') stats.rating = parseAbbr(raw);
                else if (iconName.includes('fa-comment')) stats.comments = parseAbbr(raw);
            });
            console.log('[parseBookFromPage] stats:', stats);

            let chapters = await fetchAccurateChapterCount(doc, bookId);
            if (chapters === null) { // Fallback về cách cũ nếu API lỗi
                const latestChapterLink = Array.from(info.querySelectorAll('p a')).find(a => a.href.includes('/truyen/') && a.href.includes('/chuong-'));
                if (latestChapterLink) {
                    const chapterText = latestChapterLink.textContent.trim();
                    const chapterMatch = chapterText.match(/chương\s*(\d+)/i) || chapterText.match(/(\d+)/);
                    if (chapterMatch) chapters = parseInt(chapterMatch[1], 10);
                }
            }
            console.log('[parseBookFromPage] chapters:', chapters);

            const genreP =
                  Array.from(doc.querySelectorAll('.book-desc p'))
            .find(p => /thể loại/i.test(p.textContent)) || null;
            const genreLinks = genreP ? Array.from(genreP.querySelectorAll('a')) : [];
            const collections = genreLinks.map(a => a.textContent.trim()).filter(Boolean);
            const tags = collections[1] ? [collections[1]] : [];

            console.log('[parseBookFromPage] collections:', collections, 'tags:', tags);
            const getManagerSlug = (div) => {
                const a = div?.querySelector('.manager-name a[href^="/user/"]');
                if (!a) return null;
                const m = a.getAttribute('href').match(/\/user\/([^/]+)/);
                return m ? decodeURIComponent(m[1]) : null;
            };

            const newFlags = {};
            const managerDivs = doc.querySelectorAll('.book-manager');

            const roleOf = (div) => div?.querySelector('.manager-role')?.textContent.trim();

            const posterDiv = Array.from(managerDivs).find(div => roleOf(div) === 'Người đăng');
            const coManagerDivs = Array.from(managerDivs).filter(div => roleOf(div) === 'Đồng quản lý');

            if (posterDiv && currentUser) {
                const posterSlug = getManagerSlug(posterDiv);
                console.log('[parseBookFromPage] posterSlug:', posterSlug, 'currentUser:', currentUser);
                if (posterSlug && posterSlug === currentUser) {
                    newFlags.poster = true;
                    if (coManagerDivs.length > 0) newFlags.managerOwner = true;
                }
            }

            if (coManagerDivs.length > 0 && currentUser) {
                const coManagerSlugs = coManagerDivs.map(getManagerSlug).filter(Boolean);
                console.log('[parseBookFromPage] coManagerSlugs:', coManagerSlugs);
                if (coManagerSlugs.includes(currentUser) && !newFlags.poster) {
                    newFlags.managerGuest = true;
                }
            }


            newFlags.embedLink = !!Array.from(doc.querySelectorAll('.book-desc p a')).find(a => a.textContent === 'Liên kết nhúng');
            newFlags.embedFile = !newFlags.embedLink;
            console.log('[parseBookFromPage] newFlags:', newFlags);

            const summaryEl = doc.querySelector('.book-desc-detail');
            const summary = summaryEl ? summaryEl.innerText.trim() : '';
            console.log('[parseBookFromPage] summary captured:', summary.substring(0, 100) + '...'); // Log 100 ký tự đầu

            const oldBook = state.cache?.books?.[bookId] || {};
            console.log('[parseBookFromPage] oldBook.flags:', oldBook.flags);

            const result = {
                id: bookId, title, url: bookUrl, coverUrl, author, status,
                summary,
                statusNorm: norm(status), titleNorm: norm(title), authorNorm: norm(author),
                tags, stats, chapters, updated, updated,
                updatedISO: updated ? updated.toISOString() : '', updatedTs: updated ? +updated : 0,
                updatedText: updated ? fmtDate(updated) : '',
                collectedAt: oldBook.collectedAt || new Date().toISOString(),
                collections,
                flags: { ...oldBook.flags, ...newFlags },
            };
            console.log('[parseBookFromPage] result:', result);
            return result;
        } catch (err) {
            console.error('[WorksManager] parseBookFromPage failed', err);
            return null;
        }
    };


    const parseSummaryFromPage = (doc) => {
        const summaryEl = doc.querySelector('.book-desc-detail');
        return summaryEl ? summaryEl.innerText.trim() : '';
    };

    const handleManualAdd = async () => {
        const url = window.prompt('Nhập URL truyện cần thêm/cập nhật:', '');
        if (!url) return;

        try {
            const parsedUrl = new URL(url);
            if (!ALLOWED_HOSTNAMES.includes(parsedUrl.hostname) || !parsedUrl.pathname.startsWith('/truyen/')) {
                throw new Error('URL không hợp lệ.');
            }
            updateOverlay({ text: 'Đang tải và xử lý truyện...', progress: 50, meta: '' });
            const response = await fetch(parsedUrl.href);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const bookId = window.bookId || doc.querySelector('input[name="bookId"]')?.value;
            if (!bookId) throw new Error('Không tìm thấy ID truyện.');
            const currentUserSlug = getCurrentUser(doc);
            if (!currentUserSlug) throw new Error('Không xác định được người dùng.');

            state.key = `works:${currentUserSlug}:works:v${STORE_VERSION}`;
            await localforage.ready();
            await loadCache();

            const book = await parseBookFromPage(doc, bookId, parsedUrl.href, state.cache ? state.cache.username : currentUserSlug);
            if (!book) throw new Error('Không thể phân tích thông tin truyện.');
            const userHasRole = book.flags.poster || book.flags.managerOwner || book.flags.managerGuest || book.flags.editorOwner || book.flags.editorGuest;
            if (!userHasRole) throw new Error(`Bạn không có vai trò quản lý nào cho truyện này.`);

            if (!state.cache) {
                state.cache = { books: {}, bookIds: [], version: STORE_VERSION, username: currentUserSlug, mode: 'works' };
            }
            if (!state.cache.books[book.id]) {
                state.cache.bookIds.unshift(book.id);
            }
            state.cache.books[book.id] = book;
            await saveCache(state.cache);
            notify(TEXT.manualAdded);


            if (state.channel) {
                state.channel.postMessage({ origin: ORIGIN_ID, type: 'add', book });
            }
            if (state.filterModal) {
                console.log('[WorksManager] Cửa sổ lọc đang mở, tự động làm mới kết quả.');
                state.filterModal.shadowRoot.querySelector('button[data-action="apply"]').click();
            }

        } catch (err) {
            console.error('[WorksManager] Manual Add failed', err);
            notify(`Lỗi: ${err.message}`, true);
        } finally {
            hideOverlay();
            updateSummary();
        }
    };


    const runFilter = (criteria) => {
        if (!state.cache) return [];
        const roleProps = {
            poster: 'poster',
            managerOwner: 'managerOwner',
            managerGuest: 'managerGuest',
            editorOwner: 'editorOwner',
            editorGuest: 'editorGuest'
        };
        const flagProps = {
            private: 'private',
            embedLink: 'embedLink',
            embedFile: 'embedFile',
            duplicate: 'duplicate',
            vip: 'vip'
        };
        const toMs = (v) => {
            if (!v) return 0;
            return (v instanceof Date) ? v.getTime() : (Date.parse(v) || 0);
        };
        const dateInputToMs = (s) => s ? Date.parse(s) : 0;
        let list = state.cache.bookIds.map((id) => state.cache.books[id]).filter(Boolean);
        if (criteria.status && criteria.status !== 'all') {
            const target = norm(criteria.status);
            list = list.filter((b) => b.statusNorm === target);
        }
        if (criteria.search) {
            const q = norm(criteria.search);
            list = list.filter((b) => b.titleNorm.includes(q) || b.authorNorm.includes(q));
        }
        if (criteria.summarySearch) {
            const q = norm(criteria.summarySearch);
            // Chỉ tìm trong các truyện có văn án
            list = list.filter((b) => b.summary && norm(b.summary).includes(q));
        }
        if (criteria.categories.length) {
            list = list.filter((b) => b.collections && b.collections.some((label) => criteria.categories.includes(label)));
        }
        if (criteria.roles.length) {
            list = list.filter((b) => criteria.roles.some((role) => b.flags && b.flags[roleProps[role]]));
        }
        if (criteria.flags.length) {
            list = list.filter((b) => criteria.flags.every((flag) => b.flags && b.flags[flagProps[flag]]));
        }

        if (criteria.fromDate) {
            const fromMs = dateInputToMs(criteria.fromDate);
            list = list.filter((b) => !toMs(b.updated) || toMs(b.updated) >= fromMs);
        }
        if (criteria.toDate) {
            const toMsVal = dateInputToMs(criteria.toDate);
            list = list.filter((b) => !toMs(b.updated) || toMs(b.updated) <= toMsVal);
        }

        list = list.slice();
        const sort = criteria.sortBy || 'recent';
        list.sort((a, b) => {
            if (sort === 'recent') return toMs(b.updated) - toMs(a.updated);
            if (sort === 'oldest') return toMs(a.updated) - toMs(b.updated);
            if (sort === 'views') return (b.stats.views || 0) - (a.stats.views || 0);
            if (sort === 'rating') return (b.stats.rating || 0) - (a.stats.rating || 0);
            if (sort === 'title') return a.title.localeCompare(b.title, 'vi');
            return 0;
        });

        return list;
    };

    const buildCheckGroup = (name, options) => {
        if (!options.length) return '<div style="opacity:.6;">Không có dữ liệu</div>';
        return options.map(({ value, label }) => `
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;">
                <input type="checkbox" name="${name}" value="${value}" style="accent-color:#39c5ff;"> ${label}
            </label>
        `).join('');
    };

    const closeFilter = () => {
        if (state.filterModal) {
            state.filterModal.remove();
            state.filterModal = null;
        }
    };

    const openFilter = () => {
        if (!state.cache) {
            notify(TEXT.noCache, true);
            return;
        }
        if (state.filterModal) return;

        const wrap = document.createElement('div');
        wrap.id = 'wd-works-filter-host';
        state.filterModal = wrap;

        const shadow = wrap.attachShadow({ mode: 'open' });

        const books = state.cache.bookIds.map((id) => state.cache.books[id]).filter(Boolean);
        const categories = Array.from(new Set(books.flatMap((b) => b.collections || []))).sort((a, b) => a.localeCompare(b, 'vi'));
        const roleOptions = [
            { value: 'poster', label: 'Tôi là người đăng' }, { value: 'managerOwner', label: 'Đồng quản lý - chủ' },
            { value: 'managerGuest', label: 'Đồng quản lý - khách' }, { value: 'editorOwner', label: 'Biên tập - chủ' },
            { value: 'editorGuest', label: 'Biên tập - khách' }
        ];
        // Loại bỏ 'private' và 'vip'
        const flagOptions = [
            { value: 'embedLink', label: 'Nhúng bằng link' }, { value: 'embedFile', label: 'Nhúng bằng file' },
            { value: 'duplicate', label: 'Truyện trùng' }
        ];

        shadow.innerHTML = `
        <style>
            :host { all: initial; } /* Reset mạnh nhất */
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: Segoe UI, sans-serif; color: #fff; }
            .modal-root { position: fixed; inset: 0; background: rgba(7, 12, 18, 0.85); z-index: 99996; display: flex; align-items: center; justify-content: center; }
            .modal-content { background: #111c28; padding: 20px 24px 26px; border-radius: 14px; width: min(850px, 94vw); max-height: 92vh; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 20px 44px rgba(0,0,0,0.4); }
            label, .group-title { font-size: 12px; display: block; margin-bottom: 4px; }
            input[type="date"], input[type="text"], select { width: 100%; padding: 7px 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; border-radius: 6px; font-size: 13px; }
            select { appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right .7em top 50%; background-size: .65em auto; }
            select option { background: #2c3e50; color: #fff; }
            button { cursor: pointer; border: none; }
            .checkbox-label { display:flex; align-items:center; gap:6px; font-size:12px; }
            .checkbox-label input { accent-color:#39c5ff; }
            .header { display:flex; justify-content:space-between; align-items:center; } .header strong { font-size: 16px; } .header button { background:none; font-size:20px; }
            #filterForm { display:flex; flex-direction:column; gap:12px; } .form-row { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
            .checkbox-groups { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; border-top:1px solid rgba(255,255,255,0.1); padding-top:16px; }
            .checkbox-group-body { max-height: 120px; overflow-y: auto; padding-right: 8px; }
            .footer { display:flex; justify-content:flex-end; gap:8px; } .footer .btn-apply { background:#39c5ff; color:#0b1220; padding:6px 14px; border-radius:6px; font-weight:600; } .footer .btn-close { background:rgba(255,255,255,0.12); color:#fff; padding:6px 12px; border-radius:6px; }
            .results { font-size:12px; line-height:1.5; } .results-header { margin-bottom: 8px; } .results-body { max-height:min(300px, 40vh); overflow:auto; display:flex; flex-direction:column; gap:10px; }
            .result-item { display:flex; justify-content:space-between; align-items:flex-start; padding:8px 10px; border:1px solid rgba(255,255,255,0.1); border-radius:8px; background:rgba(255,255,255,0.04); }
            .result-item-info a { color:#4bffdc; text-decoration:none; } .result-item-info div:first-child { font-size:13px; font-weight:600; margin-bottom:4px; } .result-item-info div:last-child { font-size:12px; opacity:.82; line-height:1.5; }
            .btn-remove { background:rgba(246,78,96,0.28); color:#fff; padding:4px 8px; border-radius:4px; margin-left:10px; flex-shrink:0; }
        </style>
        <div class="modal-root">
            <div class="modal-content">
                <div class="header"><strong>Lọc works</strong><button data-action="close">×</button></div>
                <form id="filterForm">
                    <div class="form-row">
                        <div><label for="filter-from">Từ ngày</label><input id="filter-from" type="date" name="from"></div>
                        <div><label for="filter-to">Đến ngày</label><input id="filter-to" type="date" name="to"></div>
                        <div><label for="filter-status">Trạng thái</label><select id="filter-status" name="status"><option value="all">Tất cả</option><option value="Còn tiếp">Còn tiếp</option><option value="Hoàn thành">Hoàn thành</option><option value="Tạm ngưng">Tạm ngưng</option><option value="Chưa xác minh">Chưa xác minh</option></select></div>
                        <div><label for="filter-sortby">Sắp xếp</label><select id="filter-sortby" name="sortBy"><option value="recent">Cập nhật mới nhất</option><option value="oldest">Cập nhật cũ nhất</option><option value="views">Lượt xem giảm dần</option><option value="rating">Đánh giá giảm dần</option><option value="title">Tiêu đề A→Z</option></select></div>
                    </div>
                    <div><label for="filter-search">Tìm kiếm</label><input id="filter-search" type="text" name="search" placeholder="Tiêu đề / Tác giả"></div>
                    <div><label for="filter-summary">Tìm trong văn án</label><input id="filter-summary" type="text" name="summarySearch" placeholder="Nội dung trong tóm tắt truyện"></div>
                </form>
                <div class="checkbox-groups">
                    <div><div class="group-title">Thể loại</div><div class="checkbox-group-body">${buildCheckGroup('category', categories.map((label) => ({ value: label, label })))}</div></div>
                    <div><div class="group-title">Vai trò</div><div class="checkbox-group-body">${buildCheckGroup('role', roleOptions)}</div></div>
                    <div><div class="group-title">Thuộc tính</div><div class="checkbox-group-body">${buildCheckGroup('flag', flagOptions)}</div></div>
                </div>
                <div class="footer"><button class="btn-apply" data-action="apply">Lọc</button><button class="btn-close" data-action="close">Đóng</button></div>
                <div class="results"></div>
            </div>
        </div>
    `;

        const modalRoot = shadow.querySelector('.modal-root');
        modalRoot.addEventListener('click', (event) => {
            const action = event.target.dataset.action;
            if (action === 'close') closeFilter();
            else if (action === 'apply') {
                const form = shadow.querySelector('#filterForm');
                const criteria = {
                    fromDate: form.elements.from.value || '', toDate: form.elements.to.value || '',
                    status: form.elements.status.value || 'all', search: form.elements.search.value || '',
                    summarySearch: form.elements.summarySearch.value || '',
                    sortBy: form.elements.sortBy.value || 'recent',
                    categories: Array.from(shadow.querySelectorAll('input[name=category]:checked')).map(i => i.value),
                    roles: Array.from(shadow.querySelectorAll('input[name=role]:checked')).map(i => i.value),
                    flags: Array.from(shadow.querySelectorAll('input[name=flag]:checked')).map(i => i.value)
                };
                const results = runFilter(criteria);
                renderResults(shadow.querySelector('.results'), results);
            }
        });
        const resultsContainer = shadow.querySelector('.results');
        resultsContainer.addEventListener('click', (event) => {
            const removeButton = event.target.closest('button[data-action="manual-remove"]');
            if (removeButton && removeButton.dataset.id) {
                handleManualRemove(removeButton.dataset.id).then(() => {
                    shadow.querySelector('button[data-action="apply"]').click();
                });
            }
        });
        document.body.appendChild(wrap);
        shadow.querySelector('button[data-action="apply"]').click();
    };


    const renderResults = (container, results) => {
        let headerText = `Tìm thấy ${fmtNum(results.length)} truyện.`;
        let displayedResults = results;

        if (results.length > FILTER_RESULT_LIMIT) {
            headerText = `Tìm thấy ${fmtNum(results.length)} truyện. Đang hiển thị ${FILTER_RESULT_LIMIT} kết quả đầu tiên. Hãy dùng bộ lọc để thu hẹp tìm kiếm.`;
            displayedResults = results.slice(0, FILTER_RESULT_LIMIT);
        }

        container.innerHTML = `<div class="results-header">${headerText}</div>`;
        const holder = document.createElement('div');
        holder.className = 'results-body';

        displayedResults.forEach((book) => {
            if (!book) return;
            const row = document.createElement('div');
            row.className = 'result-item';

            const flags = book.flags || {};
            const stats = book.stats || {};
            const collections = book.collections || [];

            const roles = [];
            if (flags.poster) roles.push('Tôi đăng'); if (flags.managerOwner) roles.push('Đồng quản lý - chủ'); if (flags.managerGuest) roles.push('Đồng quản lý - khách');
            if (flags.editorOwner) roles.push('Biên tập - chủ'); if (flags.editorGuest) roles.push('Biên tập - khách');

            const attrs = [];
            if (flags.embedLink) attrs.push('Nhúng link'); if (flags.embedFile) attrs.push('Nhúng file'); if (flags.duplicate) attrs.push('Truyện trùng');

            const lines = [];
            lines.push(`${book.author || ''} • ${book.status || ''}`);
            lines.push(`Cập nhật: ${book.updated ? fmtDate(book.updated) : '—'} • Chương: ${book.chapters != null ? fmtNum(book.chapters) : '?'}`);

            // --- DÒNG ĐÃ SỬA LỖI ---
            const statsLine = `Views: ${stats.views != null ? fmtNum(stats.views) : '?'} • Rating: ${stats.rating != null ? fmtNum(stats.rating) : '?'} • Bình luận: ${stats.comments != null ? fmtNum(stats.comments) : '?'}`;
            lines.push(statsLine);

            if (collections.length) lines.push(`Thể loại: ${collections.join(', ')}`);
            if (roles.length) lines.push(`Vai trò: ${roles.join(', ')}`);
            if (attrs.length) lines.push(`Thuộc tính: ${attrs.join(', ')}`);

            row.innerHTML = `
            <div class="result-item-info">
                <div><a href="${book.url}" target="_blank">${book.title}</a></div>
                <div>${lines.join('<br>')}</div>
            </div>
            <button class="btn-remove" data-action="manual-remove" data-id="${book.id}">Xóa</button>
        `;
            holder.appendChild(row);
        });
        container.appendChild(holder);
    };

    const readMaxPages = (doc) => {
        const lastPageLink = doc.querySelector('.pagination li:last-child a[href*="start="]');
        if (lastPageLink) {
            try {
                const start = new URL(lastPageLink.href, window.location.origin).searchParams.get('start');
                return (parseInt(start, 10) / 10) + 1;
            } catch (e) { /* ignore */ }
        }
        // Nếu không có nút trang cuối, kiểm tra xem có truyện nào không
        return doc.querySelector('.book-info') ? 1 : 0;
    };

    const handleSync = async () => {
        if (state.syncing) {
            notify(TEXT.syncRunning, true); return;
        }

        const options = await askSyncOptions();
        if (!options) { // Người dùng đã hủy
            return;
        }

        setTimeout(async () => {
            const started = Date.now();
            state.syncing = true;
            state.abort = false;

            const isFullSync = options.mode.startsWith('full');
            const shouldFetchSummaries = options.mode === 'full_with_summary' || options.mode === 'summary_only';

            // LOGIC MỚI: Khởi tạo aggregated dựa trên chế độ sync
            let aggregated;
            if (options.mode === 'summary_only' && state.cache) {
                aggregated = state.cache; // Dùng cache cũ cho chế độ chỉ lấy văn án
            } else if (options.mode === 'full_no_summary' && state.cache) {
                // Dùng cache cũ làm nền để hợp nhất, tránh mất văn án
                aggregated = state.cache;
            } else {
                // Bắt đầu mới cho đồng bộ đầy đủ có văn án, hoặc khi chưa có cache
                aggregated = { books: {}, bookIds: [] };
            }

            try {
                if (isFullSync) {
                    updateOverlay({ text: 'Giai đoạn 1/3: Lấy danh sách truyện', subTask: 'Bắt đầu...', progress: 0 });
                    const firstDoc = state.hasInitialFilter ? await fetchDocument(0) : document;
                    const firstData = extractFromDocument(firstDoc);

                    if (!firstData.list.length && (firstData.total === 0 || readTotal(firstDoc) === 0)) {
                        notify("Không có works nào để đồng bộ."); throw new Error("empty");
                    }
                    if (!firstData.list.length) throw new Error('Không đọc được danh sách works.');

                    let pageSize = firstData.pageSize || 10;
                    let maxPages = readMaxPages(firstDoc);

                    // LOGIC MỚI: Xử lý trang đầu tiên với logic hợp nhất
                    firstData.list.forEach(book => {
                        if (options.mode === 'full_no_summary' && state.cache) {
                            const existingBook = aggregated.books[book.id] || {};
                            aggregated.books[book.id] = { ...existingBook, ...book }; // Giữ văn án (nếu có), cập nhật phần còn lại
                            if (!existingBook.id) { aggregated.bookIds.push(book.id); } // Thêm ID nếu là truyện mới
                        } else {
                            if (book && !aggregated.books[book.id]) {
                                aggregated.bookIds.push(book.id);
                                aggregated.books[book.id] = book;
                            }
                        }
                    });

                    for (let currentPage = 2; currentPage <= maxPages; currentPage++) {
                        if (state.abort) throw new Error(TEXT.syncAbort);
                        await sleep(options.delay);
                        const start = (currentPage - 1) * pageSize;
                        const doc = await fetchDocument(start);

                        // LOGIC MỚI: Áp dụng logic hợp nhất cho các trang tiếp theo
                        extractFromDocument(doc).list.forEach(book => {
                             if (options.mode === 'full_no_summary' && state.cache) {
                                const existingBook = aggregated.books[book.id] || {};
                                aggregated.books[book.id] = { ...existingBook, ...book };
                                if (!existingBook.id) { aggregated.bookIds.push(book.id); }
                            } else {
                                if (book && !aggregated.books[book.id]) {
                                    aggregated.bookIds.push(book.id);
                                    aggregated.books[book.id] = book;
                                }
                            }
                        });

                        const progress = (currentPage / maxPages) * 100;
                        const elapsed = Date.now() - started;
                        const timePerPage = elapsed / (currentPage - 1);
                        const remainingPages = maxPages - currentPage;
                        const etaMs = timePerPage * remainingPages;
                        const etaString = etaMs > 1000 ? ` – Còn lại ~${fmtDuration(etaMs)}` : '';
                        updateOverlay({ progress: progress * 0.33, meta: `Đã quét ${currentPage}/${maxPages} trang${etaString}` });
                    }
                    await collectAdditionalMetadata(aggregated, started);
                } else {
                     if (!state.cache) {
                        notify("Cần đồng bộ đầy đủ ít nhất một lần trước khi chỉ lấy văn án.", true);
                        throw new Error("no_cache_for_summary_only");
                    }
                }

                if (shouldFetchSummaries) {
                    await collectSummaries(aggregated, options.threads, options.delay, started);
                }

                updateOverlay({ text: 'Hoàn tất', subTask: 'Lưu dữ liệu vào cache...', progress: 100 });
                const duration = Date.now() - started;

                const payload = (isFullSync || !state.cache)
                   ? {
                        version: STORE_VERSION, username: state.username, mode: state.mode,
                        syncedAt: new Date().toISOString(), durationMs: duration,
                        bookIds: aggregated.bookIds, books: aggregated.books, sourceTotal: aggregated.bookIds.length
                    }
                   : aggregated;

                await saveCache(payload);
                updateOverlay({ meta: `Hoàn tất sau ${fmtDuration(duration)}` });
                notify(TEXT.syncDone);
                setTimeout(() => {
                    notify('Đồng bộ xong, hãy nhấn "Xuất" để tạo bản sao lưu dữ liệu!', false);
                }, 2000);

            } catch (err) {
                 if (err.message === "empty" || err.message === "no_cache_for_summary_only") { /* do nothing */ }
                else if (err && err.message === TEXT.syncAbort) notify(TEXT.syncAbort, true);
                else { console.error('[WorksManager] sync', err); notify('Đồng bộ thất bại.', true); }
            } finally {
                state.syncing = false;
                hideOverlay();
                updateSummary();
            }
        }, 0);
    };

    const analyzeFilterTasks = async (started) => {
        updateOverlay({ text: 'Giai đoạn 2/3: Phân tích bộ lọc', subTask: 'Lấy danh sách bộ lọc mới nhất...', progress: 33 });

        // LUÔN LUÔN TẢI LẠI TRANG CHÍNH ĐỂ LẤY DANH SÁCH BỘ LỌC ĐẦY ĐỦ
        const cleanDoc = await fetchDocument(0);

        const anchors = Array.from(cleanDoc.querySelectorAll('#ddFilter a'));
        const handlers = { bc: 'Thể loại', ba: 'Vai trò', be: 'Vai trò', bt: 'Thuộc tính', bs: 'Trạng thái' };
        const tasks = [];

        const totalAnalysisTasks = anchors.filter(a => a.getAttribute('href') && a.getAttribute('href') !== '#!').length;
        let analyzedCount = 0;

        for (const anchor of anchors) {
            if (state.abort) throw new Error(TEXT.syncAbort);
            const label = anchor.textContent.trim();
            const href = anchor.getAttribute('href');
            if (!href || href === '#!' || !label || label === 'Tất cả') continue;

            analyzedCount++;
            const elapsed = Date.now() - started;
            const etaString = `– ETA: ${fmtDuration((elapsed / analyzedCount) * (totalAnalysisTasks - analyzedCount))}`;
            updateOverlay({ subTask: `Phân tích: ${label} ${etaString}` });

            try {
                const url = new URL(href, window.location.origin);
                url.searchParams.delete('start');
                const entries = Array.from(url.searchParams.entries());
                if (entries.length !== 1) continue;
                const [key, value] = entries[0];
                if (!handlers[key]) continue;

                const filterDoc = await fetchDocument(0, { [key]: value });
                const total = readTotal(filterDoc);
                const pages = readMaxPages(filterDoc);
                tasks.push({ label, key, value, group: handlers[key], params: { [key]: value }, total: total || 0, pages });
                updateOverlay({ meta: `Đã phân tích: ${label} (${total} truyện / ${pages} trang)` });
                await sleep(500);
            } catch (_) {}
        }
        return tasks;
    };

    const applyTask = (book, task) => {
        if (!book) return;
        const { flags, collections } = book;
        switch (task.key) {
            case 'bc': addUnique(collections, task.label); break;
            case 'ba':
                if (task.value === '1') { // Đồng quản lý - chủ
                    flags.managerOwner = true;
                    flags.poster = true; // Là trường hợp đặc biệt của "Tôi là người đăng"
                } else if (task.value === '3') { // Tôi là người đăng
                    flags.poster = true;
                } else if (task.value === '2') { // Đồng quản lý - khách
                    flags.managerGuest = true;
                }
                break;
            case 'be':
                if (task.value === '1') { // Biên tập - chủ
                    flags.editorOwner = true;
                    flags.poster = true; // Cũng là trường hợp đặc biệt của "Tôi là người đăng"
                } else if (task.value === '2') { // Biên tập - khách
                    flags.editorGuest = true;
                }
                break;
            case 'bt':
                if (task.value === '1') flags.embedLink = true; else if (task.value === '2') flags.embedFile = true; break;
        }
    };

    const collectSummaries = async (aggregated, threads, delay, started) => {
        updateOverlay({ text: 'Giai đoạn 3/3: Tải văn án', subTask: 'Chuẩn bị...', progress: 85 });

        const bookIdsToFetch = aggregated.bookIds.filter(id => !aggregated.books[id]?.summary);
        if (bookIdsToFetch.length === 0) {
            updateOverlay({ meta: 'Tất cả truyện đã có văn án.' });
            await sleep(1500);
            return;
        }

        let completedCount = 0;
        const totalToFetch = bookIdsToFetch.length;
        const baseProgress = 85;

        const worker = async (queue) => {
            for (const bookId of queue) {
                if (state.abort) break;
                const book = aggregated.books[bookId];
                if (!book || !book.url) continue;

                try {
                    // 1. Vẫn fetch trang truyện như cũ để lấy HTML
                    const bookDoc = await fetchDocument(0, { overrideUrl: book.url });

                    // 2. Dùng hàm siêu nhẹ mới để lấy MỖI văn án
                    const summary = parseSummaryFromPage(bookDoc);

                    // 3. Nếu lấy được văn án, lưu lại
                    if (summary) {
                        aggregated.books[bookId].summary = summary;
                        // Lưu ngay lập tức để tránh mất dữ liệu
                        await saveCache(state.cache);
                    }
                } catch (err) {
                    console.error(`[WorksManager] Lỗi khi tải văn án cho ${book.title}:`, err);
                } finally {
                    completedCount++;
                    const progress = baseProgress + (completedCount / totalToFetch) * 15; // Giai đoạn này chiếm 15% thanh tiến trình
                    const elapsed = Date.now() - started;
                    const timePerItem = elapsed / completedCount;
                    const etaMs = timePerItem * (totalToFetch - completedCount);
                    const etaString = etaMs > 1000 ? ` – ETA: ${fmtDuration(etaMs)}` : '';

                    updateOverlay({
                        progress,
                        meta: `Đã tải ${completedCount}/${totalToFetch} văn án${etaString}`
                    });
                    await sleep(delay);
                }
            }
        };

        const queues = Array.from({ length: threads }, () => []);
        bookIdsToFetch.forEach((id, index) => queues[index % threads].push(id));

        const workers = queues.map(queue => worker(queue));
        await Promise.all(workers);
    };


    const collectAdditionalMetadata = async (aggregated, started) => {
        // Reset flags và collections (giữ nguyên)
        Object.values(aggregated.books).forEach(book => {
            book.flags = { poster: false, managerOwner: false, managerGuest: false, editorOwner: false, editorGuest: false, embedLink: false, embedFile: false, duplicate: false };
            book.collections = [];
        });

        const allTasks = await analyzeFilterTasks(document, started);

        // Tách các tác vụ: tác vụ trạng thái ('bs') sẽ được xử lý riêng
        const otherTasks = allTasks.filter(task => task.key !== 'bs');

        // --- PHẦN 1: Xử lý các metadata khác (Thể loại, Vai trò, Thuộc tính) ---
        const taskGroups = otherTasks.reduce((acc, task) => {
            if (!acc[task.group]) acc[task.group] = [];
            acc[task.group].push(task);
            return acc;
        }, {});

        const masterIdSet = new Set(aggregated.bookIds);
        const totalGroups = Object.keys(taskGroups).length;
        let groupIndex = 0;

        console.group('[Works Manager DEBUG] Bắt đầu thu thập Metadata (không bao gồm Trạng thái)');

        for (const groupName in taskGroups) {
            groupIndex++;
            const progressBase = 33 + (50 * (groupIndex - 1) / totalGroups);
            updateOverlay({ text: `Giai đoạn 2/3: Thu thập ${groupName}`, subTask: 'Bắt đầu...', progress: progressBase });
            console.group(`[DEBUG] Xử lý nhóm: "${groupName}"`);

            const groupTasks = taskGroups[groupName];
            if (groupTasks.length === 0) {
                console.log('Không có tác vụ nào, bỏ qua.'); console.groupEnd(); continue;
            }

            groupTasks.sort((a, b) => b.total - a.total);
            const majorityTask = groupTasks[0];
            const minorityTasks = groupTasks.slice(1);
            const processedInMinorities = new Set();

            console.log(` -> Nhóm lớn nhất (sẽ được suy luận): "${majorityTask.label}" (${majorityTask.total} truyện)`);
            console.log(` -> Các nhóm nhỏ hơn (sẽ quét):`, minorityTasks.map(t => `${t.label} (${t.total})`));

            for (const [i, task] of minorityTasks.entries()) {
                if (state.abort) throw new Error(TEXT.syncAbort);
                updateOverlay({ subTask: `Đang quét: ${task.label} (${task.total} truyện)...` });
                const ids = await fetchIdsForTask(task);
                ids.forEach(id => {
                    const book = aggregated.books[id];
                    if (book) {
                        applyTask(book, task);
                        processedInMinorities.add(id);
                    }
                });
            }

            const remainingIds = [...masterIdSet].filter(id => !processedInMinorities.has(id));
            console.log(` -> Số truyện đã xử lý trong các nhóm nhỏ: ${processedInMinorities.size}`);
            console.log('%c -> KẾT QUẢ: An toàn. Bắt đầu suy luận.', 'color: lightgreen');
            updateOverlay({ subTask: `Suy luận cho: ${majorityTask.label} (${remainingIds.length} truyện)` });
            remainingIds.forEach(id => applyTask(aggregated.books[id], majorityTask));

            console.groupEnd();
            updateOverlay({ progress: 33 + (50 * groupIndex / totalGroups) });
        }
        console.groupEnd();


        // --- PHẦN 2: Kiểm tra và đồng bộ lại theo Trạng thái nếu cần ---
        updateOverlay({ text: `Giai đoạn 2/3: Kiểm tra Trạng thái`, subTask: 'Bắt đầu...', progress: 85 });
        console.group('[Works Manager DEBUG] Bắt đầu kiểm tra Trạng thái');

        // Nhóm các truyện đã quét được theo trạng thái của chúng
        const localStatusGroups = Object.values(aggregated.books).reduce((acc, book) => {
            if (book && book.status) {
                if (!acc[book.status]) acc[book.status] = [];
                acc[book.status].push(book);
            }
            return acc;
        }, {});

        const cleanDoc = await fetchDocument(0);
        const statusAnchors = Array.from(cleanDoc.querySelectorAll('#ddFilter a[href*="bs="]'));

        for (const anchor of statusAnchors) {
            if (state.abort) throw new Error(TEXT.syncAbort);
            const label = anchor.textContent.trim();
            const href = anchor.getAttribute('href');
            if (!href || href === '#!') continue;

            const url = new URL(href, window.location.origin);
            const key = url.searchParams.keys().next().value;
            if (key !== 'bs') continue;
            const value = url.searchParams.get(key);
            const params = { [key]: value };

            const localCount = localStatusGroups[label] ? localStatusGroups[label].length : 0;
            updateOverlay({ subTask: `Kiểm tra: ${label}...` });

            const firstPageDoc = await fetchDocument(0, params);
            const serverTotal = readTotal(firstPageDoc);
            const serverPages = readMaxPages(firstPageDoc);

            if (serverTotal === null || (serverTotal === 0 && localCount === 0)) {
                console.log(` -> Bỏ qua trạng thái "${label}" (không có truyện trên server).`);
                continue;
            }

            // Điều kiện kiểm tra: tổng số trên server phải khớp với số đã quét, VÀ phải thỏa mãn điều kiện an toàn
            const isSafe = serverTotal >= (serverPages - 1) * 10 && serverTotal <= serverPages * 10;
            const isMismatched = serverTotal !== localCount;

            console.log(` -> Trạng thái: "${label}" | Local: ${localCount} | Server: ${serverTotal} | Pages: ${serverPages} | Safe: ${isSafe}`);

            if (isMismatched || !isSafe) {
                console.warn(` -> KHÔNG KHỚP cho "${label}". Local=${localCount}, Server=${serverTotal}, Safe=${isSafe}. Bắt đầu quét lại toàn bộ.`);
                updateOverlay({ subTask: `Quét lại "${label}" (${serverTotal} truyện)...` });

                const booksFromFullScan = await fetchAllBooksForTask({ label, params });
                let newBooksAdded = 0;
                let updatedBooks = 0;

                booksFromFullScan.forEach(book => {
                    // Nếu đây là một truyện hoàn toàn mới, thì thêm ID vào danh sách chính
                    if (!aggregated.books[book.id]) {
                        aggregated.bookIds.push(book.id);
                        newBooksAdded++;
                    } else {
                        // Nếu không, đây là một truyện cần cập nhật
                        updatedBooks++;
                    }

                    // QUAN TRỌNG: Luôn luôn ghi đè thông tin truyện bằng dữ liệu mới nhất từ lần quét
                    aggregated.books[book.id] = book;
                });

                console.log(` -> Đã quét lại "${label}", thêm ${newBooksAdded} truyện mới và cập nhật ${updatedBooks} truyện.`);
                if (newBooksAdded > 0 || updatedBooks > 0) {
                    updateOverlay({ meta: `Đã cập nhật ${newBooksAdded + updatedBooks} truyện từ "${label}"` });
                } else {
                     console.log(` -> Quét lại "${label}" nhưng không tìm thấy thay đổi nào.`);
                }
            } else {
                console.log(` -> Trạng thái "${label}" đã khớp.`);
            }
        }
        console.groupEnd(); // End DEBUG group
    };



    const initializeStoryPage = async () => {
        const currentUserSlug = getCurrentUser(document);
        if (!currentUserSlug) return;
        const bookId = window.bookId || document.querySelector('input[name="bookId"]')?.value;
        if (!bookId) return;

        state.key = `works:${currentUserSlug}:works:v${STORE_VERSION}`;
        localforage.config(STORE_CFG);
        await localforage.ready();
        await loadCache();

        if (!state.cache || !state.cache.books || !state.cache.books[bookId]) return;

        const updatedBook = await parseBookFromPage(document, bookId, window.location.href.split('#')[0], state.cache.username);

        if (updatedBook) {
            state.cache.books[bookId] = updatedBook;
            await saveCache(state.cache);
            notify(`Đã cập nhật "${updatedBook.title}" từ trang truyện.`);
            // Gửi thông báo cập nhật cho các tab khác
            const channelName = `${BROADCAST_PREFIX}${state.key}`;
            try {
                const channel = new BroadcastChannel(channelName);
                channel.postMessage({ origin: ORIGIN_ID, type: 'update', book: updatedBook });
                channel.close();
            } catch(e) {}
        }
    };

    const initializeWorksPage = async () => {
        const context = detectContext();
        if (!context) return;
        state.username = context.username;
        state.mode = context.mode;
        state.basePath = context.basePath;
        state.key = `works:${state.username}:${state.mode}:v${STORE_VERSION}`;

        localforage.config(STORE_CFG);
        await localforage.ready();
        ensurePanel();
        await loadCache();
        updateSummary();

        // Thiết lập kênh liên lạc
        state.channelName = `${BROADCAST_PREFIX}${state.key}`;
        try {
            state.channel = new BroadcastChannel(state.channelName);
            state.channel.onmessage = (event) => {
                if (event.data.origin === ORIGIN_ID) return; // Bỏ qua tin nhắn từ chính mình

                const { type, book, bookId, title } = event.data;
                let message = '';
                let needsUiUpdate = false;

                if (type === 'update' && book && state.cache?.books[book.id]) {
                    state.cache.books[book.id] = book;
                    message = `Đã nhận cập nhật cho: "${book.title}"`;
                    needsUiUpdate = true;
                } else if (type === 'add' && book && state.cache) {
                    if (!state.cache.books[book.id]) {
                        state.cache.bookIds.unshift(book.id);
                    }
                    state.cache.books[book.id] = book;
                    message = `Đã nhận truyện mới: "${book.title}"`;
                    needsUiUpdate = true;
                } else if (type === 'remove' && bookId && state.cache?.books[bookId]) {
                    state.cache.bookIds = state.cache.bookIds.filter(id => id !== bookId);
                    delete state.cache.books[bookId];
                    message = `Đã xóa truyện: "${title}"`;
                    needsUiUpdate = true;
                }

                if (needsUiUpdate) {
                    console.log(`[WorksManager] Broadcast received: ${message}`);
                    setMessage(message);
                    setTimeout(() => { if (panelMessage().textContent === message) setMessage(''); }, 5000);

                    // Không cần saveCache vì tab gốc đã lưu, chỉ cần cập nhật UI
                    updateSummary();
                    if (state.filterModal) {
                        state.filterModal.shadowRoot.querySelector('button[data-action="apply"]').click();
                    }
                }
            };
        } catch (e) {
            if (!broadcastWarned) {
                console.warn('[WorksManager] BroadcastChannel không được hỗ trợ. Đồng bộ thời gian thực sẽ không hoạt động.');
                broadcastWarned = true;
            }
        }

        GM_registerMenuCommand('Đồng bộ works', handleSync);
        GM_registerMenuCommand('Xuất dữ liệu works', handleExport);
        GM_registerMenuCommand('Nhập dữ liệu works', handleImport);
        GM_registerMenuCommand('Lọc works', openFilter);
        if (!state.cache) notify(TEXT.needSync);
    };

    const bootstrap = async () => {
        const path = window.location.pathname;
        if (path.includes('/user/') && path.includes('/works')) {
            await initializeWorksPage();
        } else if (path.startsWith('/truyen/')) {
            await initializeStoryPage();
        }
    };

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
            bootstrap().catch((err) => console.error('[WorksManager] init', err));
        }, { once: true });
    } else {
        bootstrap().catch((err) => console.error('[WorksManager] init', err));
    }
})();