// ==UserScript==
// @name         Wikidich Works Manager
// @namespace    https://github.com/BaoBao666888/
// @version      0.3.0
// @description  Đồng bộ toàn bộ works cá nhân trên Wikidich, lưu vào localForage, hỗ trợ lọc nâng cao và xuất/nhập dữ liệu.
// @author       QuocBao
// @match        https://truyenwikidich.net/user/*/works*
// @match        https://truyenwikidich.net/truyen/*
// @icon         data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAFgAAACgAAABAAAAAgAAAAAEAIAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAADaxiYA2sYmAdrGJnPaxibZ2sYm+9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibf2sYmgNrGJgbaxiYA2sYmAtrGJpzaxib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiaw2sYmCNrGJm3axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJn/axibd2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibl2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cUg/9jDG//Ywxr/2MMZ/9jDGf/Ywxr/2cQd/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSL/2cQd/9jDGv/Ywxn/2MMZ/9jDGf/Ywxv/2cQe/9rFI//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUi/9jDGv/Ywxr/28cp/+DORf/l12X/6dx6/+vgh//r4If/6Nt1/+PTVv/dyjT/2cQe/9jDGf/ZxB//2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cQd/9jDGf/ZxSD/3cs3/+PUWv/o3Hf/6+CH/+vgh//q3oH/5tls/+HRT//cyC7/2cQc/9jDGf/ZxSD/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/2MMa/93LN//n2nL/8eqt//n23P/+/vr//////////////////////////////////Prs//Xvw//r4In/4M9G/9nEHf/ZxB3/2sYm/9rGJP/Ywxr/2sYm/+LTVf/t45L/9vHI//377v//////////////////////////////////////+/jk//PtuP/p3n//381B/9nEHP/ZxB7/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/Ywxj/3sw7/+/moP/9++7///////////////////////////////////////////////////////////////////////7++f/z7bf/4dFN/9jCF//axiX/6d16//j01f////////////////////////////////////////////////////////////////////////////799f/y67L/4M9I/9jDGP/axiT/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nFIf/ZxR//6d19//z77P/////////////////////////////////////////////////////////////////////////////////////////////++//w56T/9/LN//////////////////////////////////////////////////////////////////////////////////////////////////799v/s4Yr/2sYj/9nEH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEH//byCz/8+yz//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Xww//dyzj/2cQc/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEHv/cyS//9/LN//////////////////////////////////////////////////389P/7+OT/+PXX//n12P/8+un////9///////////////////////////////////////////////////////////////////////////////9//z66//59tz/+PTV//r33//8++7/////////////////////////////////////////////////+vji/+HQSf/Zwxv/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nFIP/cyS//9/LN///////////////////////////////////////59tv/7eOS/+PUWv/ezDv/3Mgt/9rGJf/axib/3Mkx/+DQSf/p3Xr/9vHI//////////////////////////////////////////////////799f/z7LX/6Ntz/+DQSf/cyTL/28co/9rGJP/bxyr/3co1/+LSUP/r34X/9/PQ///////////////////////////////////////7+ej/385C/9nEHf/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/ZxR//9O68//////////////////////////////////r44v/o23X/28co/9jCGP/ZxBz/2cUh/9rGI//axiX/2sYk/9rFI//ZxB//2MMY/9nFIP/k1V//9vLL/////////////////////////////v76/+/mnv/fzT//2MMb/9jDGf/ZxB//2sUj/9rGJP/axiX/2sYk/9rFIv/ZxB7/2MMY/9rFIv/l1mP/+fXX//////////////////////////////////n12P/byCv/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/6t6B//////////////////////////////////Pstv/cyjL/2MMX/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMa/9rFIv/r4Ib//fvv////////////+fXY/+LSUf/Ywxf/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMZ/9vIKf/w6KX/////////////////////////////////8emr/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/380///788/////////////////////////////Hpqf/ZxB7/2cUg/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSH/2MMX//bwxf//////9e/A/9zJLf/Zwxv/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/2MMa/+zhiv/////////////////////////////////m2Gf/2cQa/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMa//Hpqf////////////////////////////PstP/ZxB7/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMZ/+3jkv//////9fDE/9rGJv/ZxR//2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/Ywxf/7uSW////////////////////////////+vfh/9vIKv/axiP/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUh/97MO//+/fX///////////////////////r44f/cyS7/2cUg/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+PTVf////7/+/jj/93KMv/ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYj/9nFHv/178H////////////////////////////p3Xv/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDGv/o3Hf////////////////////////////n2m//2MMY/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYl/9rFIv/388///////+TWYP/Ywxn/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/381A//388///////////////////////+PTS/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/8+y2///////////////////////59tv/2sYm/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSP/2cUh/9rFIv/axiX/2sYm/9nEG//m12b///////Pstf/Ywxr/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUj/9nFIf/ZxSL/2sYl/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDF//u5Zr//////////////////////////P/gz0j/2cUf/9rGJv/axib/2sYm/9rGJv/axiT/3Mgs//v45P//////////////////////7eKR/9jDGP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFI//Ywxv/3Mkv/97MPv/dyzf/2cQf/9nEHv/ZxB3/9e/C///////h0U7/2cQd/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiP/2MMa/9zILv/ezD7/3cs4/9nEH//ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/381A//799v//////////////////////6d5+/9jDGf/axib/2sYm/9rGJv/axib/2cQe/+HRTv////7//////////////////////+LSU//ZxB3/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFIv/bxyj/7uSW//v45P/+/fb//fvv//Tuu//fzkL/3co0///++//38sv/2cQe/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/28cn/+3jlP/7+OP//v32//378P/07r3/4dBK/9nEHP/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/28MX///////////////////////Lrs//ZxBv/2sYm/9rGJv/axib/2sYm/9jDGv/o23b///////////////////////z67P/cyjL/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSD/8+23////////////////////////////+/nl/+3jk///////6t5+/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2cUg//PstP////////////////////////////377//gz0X/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/7eKP///////////////////////59tz/28cn/9rGJP/axib/2sYm/9rGJv/Ywxn/7uSZ///////////////////////489D/2sUi/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/5tlr///////////////////////////////////////////////8/+HQSf/ZxR//2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+bYaP//////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYaf///////////////////////fzz/97MOv/axSH/2sYm/9rGJv/axib/2MMb//LqsP//////////////////////9O26/9jDHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe//XwxP////////////////////////////////////////////v55v/cyC3/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/177/////////////////////////////////////////+/P/gz0f/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i01T///////////////////////7++//fzkT/2cUg/9rGJv/axib/2sYm/9nEHf/07r////////////////////////Dopv/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUi/93LNv/9/PH////////////////////////////////////////////38s3/2sUh/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rFIv/dyjT//fvu////////////////////////////////////////////6dx5/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56H/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lD/////////////////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4dFO/////////////////////////////////////////////////+/mnf/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBz/5ddl//////////////////////////////////////////////////Ptuf/ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+XWY//////////////////////////////////////////////////z7LX/2cQb/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bZa//////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//n2Gn/////////////////////////////////////////////////9e68/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGP/axiX/2sYl/9rGJf/axiX/2sYl/9rGJf/Ywxr/5thq//////////////////////////////////////////////////Ptuf/YxBv/2sYl/9rGJf/axiX/2sYl/9rGJf/axiX/2MMa/+bXaP/////////////////////////////////////////////////07bv/2cQb/9rGJf/axiX/2sYl/9rGJf/axiX/2sYl/9nEHf/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/078D//////////////////////+/mn//XwRL/2cQf/9nEH//ZxB//2cQf/9nEH//ZxB//18EU/+XXZv/////////////////////////////////////////////////z7bf/18IV/9nEH//ZxB//2cQf/9nEH//ZxB//2cQf/9fBFP/l1mP/////////////////////////////////////////////////9O25/9jCFf/ZxB//2cQf/9nEH//ZxB//2cQf/9nEH//Ywhf/4dFO///////////////////////+/vv/385E/9nFIP/axib/2sYm/9rGJv/ZxBz/8+25///////////////////////7+ej/9fDE//bxyP/28cj/9vHI//bxyP/28cj/9vHI//Xwxf/59dn//////////////////////////////////////////////////Pvt//Xwxf/28cj/9vHI//bxyP/28cj/9vHI//bxyP/18MX/+fXZ//////////////////////////////////////////////////z77v/28MX/9vHI//bxyP/28cj/9vHI//bxyP/28cj/9vDG//j00////////////////////////v73/9/NP//ZxSH/2sYm/9rGJv/axib/2MMZ/+zijf/////////////////////////////////////////////////////////////////////////////////////////////////+/ff//////////////////////////////////////////////////////////////////////////////////////////////////v33//////////////////////////////////////////////////////////////////////////////////////////////////n22//bxib/2sYk/9rGJv/axib/2sYm/9nEHv/i0U/////+////////////////////////////////////////////////////////////////////////////////////////////7eOT//z66////////////////////////////////////////////////////////////////////////////////////////////+7klv/7+eb////////////////////////////////////////////////////////////////////////////////////////////v5pz/2MMa/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+3klf//////////////////////////////////////////////////////////////////////////////////////9fDD/9jDGf/p3Xz///////////////////////////////////////////////////////////////////////////////////////bxyP/ZxBv/6Nt1///////////////////////////////////////////////////////////////////////////////////////59tr/3Mkv/9rFIv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/axSH/6+CJ//378P///////////////////////////////////////////////////////////////////vz/8uqu/9zILv/ZxSD/2cQd/+ncef/8+uz////////////////////////////////////////////////////////////////////9//Lqr//cyS//2cUg/9nEHf/o3Hj//Prr/////////////////////////////////////////////////////////////////////v/07rv/3sw5/9nEHv/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYk/9jDG//ezDv/5thp/+3jkv/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kl//o3Hj/4M9I/9nEH//axSH/2sYn/9rGJf/Ywxv/3cs3/+XXZ//t45H/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jf/6dx6/+DQSv/ZxB//2cUh/9rGJ//axiX/2MMb/93LNv/l12X/7eKQ/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+ndfP/h0Ez/2sUi/9nFH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUh/9jDG//Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMa/9nEH//axiX/2sYm/9rGJv/axib/2sYm/9rFIv/Ywxv/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGv/ZxB//2sYl/9rGJv/axib/2sYm/9rGJv/axSL/2cQc/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxr/2cQf/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axibW2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibf2sYmX9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmcdrGJgDaxiaH2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmnNrGJgPaxiYA2sYmANrGJmHaxibR2sYm+trGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibX2sYmb9rGJgDaxiYAgAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAwAAAAAAAAAM=
// @run-at       document-idle
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @updateURL    https://github.com/BaoBao666888/Novel-Downloader5/raw/refs/heads/main/TruyenWikiDich_Works_Manager.user.js
// @downloadURL  https://github.com/BaoBao666888/Novel-Downloader5/raw/refs/heads/main/TruyenWikiDich_Works_Manager.user.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js
// ==/UserScript==

/* global localforage */
(function() {
    'use strict';

    const VERSION = '0.3.0';
    const FILTER_RESULT_LIMIT = 500;
    const STORE_VERSION = 1;
    const DELAY = 1400;
    const STORE_CFG = {
        name: 'wdWorksCache',
        storeName: 'snapshots',
        description: 'Works cache for offline filtering'
    };

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
        hasInitialFilter: false
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


    const ensureOverlay = () => {
        if (state.overlay) return state.overlay;
        const wrap = document.createElement('div');
        wrap.id = 'wd-works-overlay';
        wrap.style.cssText = 'position:fixed;inset:0;background:rgba(5,10,15,0.78);display:flex;align-items:center;justify-content:center;z-index:99998;color:#fff;font-family:Segoe UI,sans-serif;';
        wrap.innerHTML = `
            <div style="background:#101722;padding:22px;border-radius:14px;min-width:280px;text-align:center;box-shadow:0 16px 36px rgba(0,0,0,.35);">
                <div class="msg" style="font-size:15px;font-weight:600;margin-bottom:12px;">Đang đồng bộ…</div>
                <div class="bar" style="width:100%;height:6px;background:rgba(255,255,255,0.15);border-radius:999px;overflow:hidden;">
                    <span style="display:block;height:100%;width:0;background:linear-gradient(90deg,#39c5ff,#4bffdc);transition:width .2s;"></span>
                </div>
                <div class="meta" style="margin-top:10px;font-size:12px;opacity:.85;"></div>
                <button data-action="stop" style="margin-top:16px;background:rgba(246,78,96,0.28);border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;">Dừng</button>
            </div>`;
        wrap.querySelector('button[data-action="stop"]').addEventListener('click', () => {
            state.abort = true;
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
        panel.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99997;background:rgba(17,25,34,0.92);color:#fff;padding:12px 14px;border-radius:10px;min-width:240px;font-family:Segoe UI,sans-serif;font-size:12px;box-shadow:0 12px 30px rgba(0,0,0,0.25);';
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong style="font-size:13px;">Works Manager</strong>
                <button data-action="toggle" style="background:none;border:none;color:#fff;font-size:16px;line-height:1;cursor:pointer;">–</button>
            </div>
            <div class="summary" style="line-height:1.6;"></div>
            <div class="actions" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;"></div>
            <div class="msg" style="margin-top:8px;opacity:.8;"></div>`;
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
        panel.addEventListener('click', (event) => {
            const target = event.target.closest('button[data-action]');
            if (!target) return;
            event.stopPropagation();
            const action = target.dataset.action;
            if (action === 'toggle') {
                const collapsed = panel.dataset.collapsed === '1';
                panel.dataset.collapsed = collapsed ? '0' : '1';
                const display = collapsed ? '' : 'none';
                panel.querySelector('.summary').style.display = display;
                panel.querySelector('.actions').style.display = display;
                panel.querySelector('.msg').style.display = display;
                target.textContent = collapsed ? '–' : '+';
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
        const url = new URL(state.basePath, window.location.origin);
        if (extraParams) {
            Object.entries(extraParams).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
        }
        if (start > 0) url.searchParams.set('start', String(start));
        const response = await fetch(url.href, {
            credentials: 'include',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        return new DOMParser().parseFromString(html, 'text/html');
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
        if (!window.confirm(`Bạn có chắc muốn xóa "${state.cache.books[bookId].title}" khỏi cache?`)) return;

        state.cache.bookIds = state.cache.bookIds.filter(id => id !== bookId);
        delete state.cache.books[bookId];

        await saveCache(state.cache);
        notify(TEXT.manualRemoved);
        updateSummary();
    };

    const parseBookFromPage = (doc, bookId, bookUrl, currentUser) => {
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

            let chapters = null;
            const latestChapterLink = Array.from(info.querySelectorAll('p a')).find(a => a.href.includes('/truyen/') && a.href.includes('/chuong-'));
            if (latestChapterLink) {
                const chapterText = latestChapterLink.textContent.trim();
                const chapterMatch = chapterText.match(/chương\s*(\d+)/i) || chapterText.match(/(\d+)/);
                if (chapterMatch) chapters = parseInt(chapterMatch[1], 10);
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

            const oldBook = state.cache?.books?.[bookId] || {};
            console.log('[parseBookFromPage] oldBook.flags:', oldBook.flags);

            const result = {
                id: bookId, title, url: bookUrl, coverUrl, author, status,
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


    const handleManualAdd = async () => {
        const url = window.prompt('Nhập URL truyện cần thêm/cập nhật:', '');
        if (!url) return;

        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname !== 'truyenwikidich.net' || !parsedUrl.pathname.startsWith('/truyen/')) {
                throw new Error('URL không hợp lệ.');
            }

            updateOverlay({ text: 'Đang tải và xử lý truyện...', progress: 50, meta: '' });
            const response = await fetch(parsedUrl.href);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            const bookIdMatch = html.match(/var\s+bookId\s*=\s*"([^"]+)"/);
            const bookId = bookIdMatch ? bookIdMatch[1] : doc.querySelector('input[name="bookId"]')?.value;
            if (!bookId) throw new Error('Không tìm thấy ID truyện trên trang.');

            const currentUser = getCurrentUser(doc);
            if (!currentUser) throw new Error('Không xác định được người dùng trên trang.');

            // Tải cache trước khi phân tích để có thể merge flags
            state.key = `works:${currentUser}:works:v${STORE_VERSION}`;
            await localforage.ready();
            await loadCache();

            const book = parseBookFromPage(doc, bookId, parsedUrl.href, currentUser);
            if (!book) throw new Error('Không thể phân tích thông tin truyện.');
            console.log('[ManualAdd] currentUser (slug):', currentUser, 'flags:', book.flags);

            const userHasRole = book.flags.poster || book.flags.managerOwner || book.flags.managerGuest || book.flags.editorOwner || book.flags.editorGuest;
            if (!userHasRole) {
                throw new Error(`Bạn không có vai trò quản lý nào cho truyện này. Không thể thêm vào danh sách.`);
            }

            if (!state.cache) {
                state.cache = { books: {}, bookIds: [], version: STORE_VERSION, username: currentUser, mode: 'works' };
            }

            const isUpdating = state.cache.books[book.id];
            if (!isUpdating) {
                state.cache.bookIds.unshift(book.id);
            }
            state.cache.books[book.id] = book;

            await saveCache(state.cache);
            notify(TEXT.manualAdded);
        } catch (err) {
            console.error('[WorksManager] Manual Add failed', err);
            notify(`Lỗi: ${err.message}`, true); // Thông báo lỗi sẽ được hiển thị cho người dùng
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

    const handleSync = async () => {
        if (state.syncing) {
            notify(TEXT.syncRunning, true);
            return;
        }
        const started = Date.now(); // <-- BẮT ĐẦU ĐẾM GIỜ NGAY TẠI ĐÂY
        state.syncing = true;
        state.abort = false;
        updateOverlay({ text: 'Đang đồng bộ works…', progress: 0, meta: '' });
        const aggregated = { books: {}, bookIds: [] };
        const addBook = (book) => {
            if (!book || !book.id) return;
            const existingBook = aggregated.books[book.id];
            if (!existingBook) {
                aggregated.bookIds.push(book.id);
                aggregated.books[book.id] = book;
            } else {
                Object.assign(existingBook, {
                    title: book.title, status: book.status, stats: book.stats, chapters: book.chapters, updated: book.updated
                });
            }
        };
        try {
            // Giai đoạn 1
            const firstData = state.hasInitialFilter ? extractFromDocument(await fetchDocument(0)) : extractFromDocument(document);
            if (!firstData.list.length && firstData.total === 0) {
                notify("Không có works nào để đồng bộ.");
                state.syncing = false; hideOverlay(); return;
            }
            if (!firstData.list.length) throw new Error('Không đọc được danh sách works trên trang hiện tại.');

            let total = firstData.total || firstData.list.length;
            let pageSize = firstData.pageSize || firstData.list.length || 10;
            firstData.list.forEach(addBook);
            let processed = firstData.list.length;
            updateOverlay({ progress: Math.min(99, (processed / Math.max(1, total)) * 50), meta: `Đã xử lý ${Math.min(processed, total)}/${total}` });

            for (let start = pageSize; start < total; start += pageSize) {
                if (state.abort) throw new Error(TEXT.syncAbort);
                await sleep(DELAY);
                const doc = await fetchDocument(start);
                const data = extractFromDocument(doc);
                if (data.total !== null) total = data.total;
                if (data.pageSize) pageSize = data.pageSize;
                data.list.forEach(addBook);
                processed = Object.keys(aggregated.books).length;
                const progress = Math.min(99, (processed / Math.max(1, total)) * 50); // Giai đoạn 1 chiếm 50%
                const elapsed = Date.now() - started;
                const avg = processed ? elapsed / processed : 0;
                const remaining = Math.max(total - processed, 0);
                const eta = avg ? fmtDuration(avg * remaining) : '';
                updateOverlay({ progress, meta: `Đã xử lý ${Math.min(processed, total)}/${total}${eta ? ` – còn ${eta}` : ''}` });
            }

            // Giai đoạn 2
            updateOverlay({ text: 'Đang thu thập nhãn bổ sung…', progress: 50, meta: '' });
            await collectAdditionalMetadata(aggregated, started);

            const duration = Date.now() - started; // <-- TÍNH THỜI GIAN Ở CUỐI CÙNG
            const payload = {
                version: STORE_VERSION, username: state.username, mode: state.mode,
                syncedAt: new Date().toISOString(), durationMs: duration,
                bookIds: aggregated.bookIds, books: aggregated.books,
                sourceTotal: aggregated.bookIds.length
            };
            await saveCache(payload);
            updateOverlay({ progress: 100, meta: `Hoàn tất sau ${fmtDuration(duration)}` });
            notify(TEXT.syncDone);
        } catch (err) {
            if (err && err.message === TEXT.syncAbort) notify(TEXT.syncAbort, true);
            else { console.error('[WorksManager] sync', err); notify('Đồng bộ thất bại.', true); }
        } finally {
            state.syncing = false;
            hideOverlay();
            updateSummary();
        }
    };

    const collectFilterTasks = (doc) => {
        const anchors = Array.from(doc.querySelectorAll('#ddFilter a'));
        const handlers = { bc: true, ba: true, be: true, bt: true, bd: true }; // bp và bv đã bị loại bỏ
        const tasks = [];
        anchors.forEach((anchor) => {
            const label = anchor.textContent.trim();
            const href = anchor.getAttribute('href');
            if (!href || href === '#!' || !label || label === 'Tất cả') return;
            try {
                const url = new URL(href, window.location.origin);
                url.searchParams.delete('start');
                const entries = Array.from(url.searchParams.entries());
                if (entries.length !== 1) return;
                const [key, value] = entries[0];
                if (!handlers[key]) return;
                tasks.push({ label, key, value, params: { [key]: value } });
            } catch (_) {}
        });
        return tasks;
    };

    // Hàm này áp dụng nhãn cho một truyện dựa trên tác vụ
    const applyTask = (book, task) => {
        if (!book) return;
        const { flags, collections } = book;
        switch (task.key) {
            case 'bc': addUnique(collections, task.label); break; // Thể loại
            case 'ba': // Vai trò người đăng/quản lý
                if (task.value === '3') flags.poster = true;
                else if (task.value === '1') flags.managerOwner = true;
                else if (task.value === '2') flags.managerGuest = true;
                break;
            case 'be': // Vai trò biên tập
                if (task.value === '1') flags.editorOwner = true;
                else if (task.value === '2') flags.editorGuest = true;
                break;
            case 'bt': // Thuộc tính nhúng
                if (task.value === '1') flags.embedLink = true;
                else if (task.value === '2') flags.embedFile = true;
                break;
            case 'bd': flags.duplicate = true; break; // Thuộc tính truyện trùng
        }
    };

    // Hàm này điều phối việc thu thập metadata
    const collectAdditionalMetadata = async (aggregated) => {
        // Reset flags và collections cho tất cả truyện trước khi thu thập
        Object.values(aggregated.books).forEach(book => {
            book.flags = { poster: false, managerOwner: false, managerGuest: false, editorOwner: false, editorGuest: false, embedLink: false, embedFile: false, duplicate: false };
            book.collections = [];
        });

        const tasks = collectFilterTasks(document);
        if (!tasks.length) return;

        for (const task of tasks) {
            if (state.abort) throw new Error(TEXT.syncAbort);
            updateOverlay({ text: `Đang thu thập: ${task.label}`, meta: '' });

            const ids = new Set();
            let start = 0;
            let total = Infinity;
            let pageSize = 10;
            while (start < total) {
                const doc = await fetchDocument(start, task.params);
                const data = extractFromDocument(doc);
                if (data.list.length === 0 && start === 0) break; // Không có truyện nào trong bộ lọc này
                data.list.forEach((book) => ids.add(book.id));
                total = data.total || total;
                pageSize = data.pageSize || pageSize;
                if (!pageSize || data.list.length < pageSize) break;
                start += pageSize;
                await sleep(DELAY);
            }

            ids.forEach((id) => {
                const book = aggregated.books[id];
                if (book) applyTask(book, task);
            });
        }
    };

    const initializeStoryPage = async () => {
        const currentUser = getCurrentUser(document);
        if (!currentUser) {
            console.log('[WorksManager] Không xác định được người dùng, bỏ qua cập nhật thụ động.');
            return;
        }
        const bookId = window.bookId || document.querySelector('input[name="bookId"]')?.value;
        //console.log(bookId);
        if (!bookId) return;

        state.key = `works:${currentUser}:works:v${STORE_VERSION}`;
        localforage.config(STORE_CFG);
        await localforage.ready();
        await loadCache();

        if (!state.cache || !state.cache.books || !state.cache.books[bookId]) {
            //console.log("Bỏ qua")
            return; // Không có trong cache thì im lặng bỏ qua
        }

        const updatedBook = parseBookFromPage(document, bookId, window.location.href.split('#')[0], currentUser);

        if (updatedBook) {
            state.cache.books[bookId] = updatedBook;
            await saveCache(state.cache);
            notify(`Đã cập nhật "${updatedBook.title}" từ trang truyện.`);
        }
    };

    // Hàm mới: chỉ chạy trên trang works
    const initializeWorksPage = async () => {
        const context = detectContext();
        if (!context) return;
        const initialQuery = context.baseQuery.toString();
        state.username = context.username;
        state.mode = context.mode;
        state.basePath = context.basePath;
        state.baseQuery = new URLSearchParams();
        state.key = `works:${state.username}:${state.mode}:v${STORE_VERSION}`;
        state.hasInitialFilter = Boolean(initialQuery);
        if (initialQuery) notify('Đang bỏ qua bộ lọc đang áp dụng. Mở trang "Tất cả" để đồng bộ đầy đủ.', true);

        localforage.config(STORE_CFG);
        await localforage.ready();
        ensurePanel();
        await loadCache();
        updateSummary();

        GM_registerMenuCommand('Đồng bộ works', handleSync);
        GM_registerMenuCommand('Xuất dữ liệu works', handleExport);
        GM_registerMenuCommand('Nhập dữ liệu works', handleImport);
        GM_registerMenuCommand('Lọc works', openFilter);

        if (!state.cache) notify(TEXT.needSync);
    };

    // Hàm bootstrap mới: đóng vai trò router
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