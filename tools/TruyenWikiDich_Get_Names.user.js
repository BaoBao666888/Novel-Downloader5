// ==UserScript==
// @name         TruyenWikiDich Get Names
// @version      2.3.0
// @description  Bảng quản lý name cho wikicv.net: xem folder, copy/tải name, quét lịch sử và xuất thống kê.
// @author       QuocBao
// @icon         data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAFgAAACgAAABAAAAAgAAAAAEAIAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAADaxiYA2sYmAdrGJnPaxibZ2sYm+9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibf2sYmgNrGJgbaxiYA2sYmAtrGJpzaxib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiaw2sYmCNrGJm3axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJn/axibd2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibl2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cUg/9jDG//Ywxr/2MMZ/9jDGf/Ywxr/2cQd/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSL/2cQd/9jDGv/Ywxn/2MMZ/9jDGf/Ywxv/2cQe/9rFI//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUi/9jDGv/Ywxr/28cp/+DORf/l12X/6dx6/+vgh//r4If/6Nt1/+PTVv/dyjT/2cQe/9jDGf/ZxB//2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cQd/9jDGf/ZxSD/3cs3/+PUWv/o3Hf/6+CH/+vgh//q3oH/5tls/+HRT//cyC7/2cQc/9jDGf/ZxSD/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/2MMa/93LN//n2nL/8eqt//n23P/+/vr//////////////////////////////////Prs//Xvw//r4In/4M9G/9nEHf/ZxB3/2sYm/9rGJP/Ywxr/2sYm/+LTVf/t45L/9vHI//377v//////////////////////////////////////+/jk//PtuP/p3n//381B/9nEHP/ZxB7/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/Ywxj/3sw7/+/moP/9++7///////////////////////////////////////////////////////////////////////7++f/z7bf/4dFN/9jCF//axiX/6d16//j01f////////////////////////////////////////////////////////////////////////////799f/y67L/4M9I/9jDGP/axiT/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nFIf/ZxR//6d19//z77P/////////////////////////////////////////////////////////////////////////////////////////////++//w56T/9/LN//////////////////////////////////////////////////////////////////////////////////////////////////799v/s4Yr/2sYj/9nEH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEH//byCz/8+yz//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Xww//dyzj/2cQc/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEHv/cyS//9/LN//////////////////////////////////////////////////389P/7+OT/+PXX//n12P/8+un////9///////////////////////////////////////////////////////////////////////////////9//z66//59tz/+PTV//r33//8++7/////////////////////////////////////////////////+vji/+HQSf/Zwxv/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nFIP/cyS//9/LN///////////////////////////////////////59tv/7eOS/+PUWv/ezDv/3Mgt/9rGJf/axib/3Mkx/+DQSf/p3Xr/9vHI//////////////////////////////////////////////////799f/z7LX/6Ntz/+DQSf/cyTL/28co/9rGJP/bxyr/3co1/+LSUP/r34X/9/PQ///////////////////////////////////////7+ej/385C/9nEHf/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/ZxR//9O68//////////////////////////////////r44v/o23X/28co/9jCGP/ZxBz/2cUh/9rGI//axiX/2sYk/9rFI//ZxB//2MMY/9nFIP/k1V//9vLL/////////////////////////////v76/+/mnv/fzT//2MMb/9jDGf/ZxB//2sUj/9rGJP/axiX/2sYk/9rFIv/ZxB7/2MMY/9rFIv/l1mP/+fXX//////////////////////////////////n12P/byCv/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/6t6B//////////////////////////////////Pstv/cyjL/2MMX/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMa/9rFIv/r4Ib//fvv////////////+fXY/+LSUf/Ywxf/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMZ/9vIKf/w6KX/////////////////////////////////8emr/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/380///788/////////////////////////////Hpqf/ZxB7/2cUg/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSH/2MMX//bwxf//////9e/A/9zJLf/Zwxv/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/2MMa/+zhiv/////////////////////////////////m2Gf/2cQa/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMa//Hpqf////////////////////////////PstP/ZxB7/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMZ/+3jkv//////9fDE/9rGJv/ZxR//2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/Ywxf/7uSW////////////////////////////+vfh/9vIKv/axiP/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUh/97MO//+/fX///////////////////////r44f/cyS7/2cUg/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+PTVf////7/+/jj/93KMv/ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYj/9nFHv/178H////////////////////////////p3Xv/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDGv/o3Hf////////////////////////////n2m//2MMY/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYl/9rFIv/388///////+TWYP/Ywxn/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/381A//388///////////////////////+PTS/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/8+y2///////////////////////59tv/2sYm/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSP/2cUh/9rFIv/axiX/2sYm/9nEG//m12b///////Pstf/Ywxr/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUj/9nFIf/ZxSL/2sYl/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDF//u5Zr//////////////////////////P/gz0j/2cUf/9rGJv/axib/2sYm/9rGJv/axiT/3Mgs//v45P//////////////////////7eKR/9jDGP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFI//Ywxv/3Mkv/97MPv/dyzf/2cQf/9nEHv/ZxB3/9e/C///////h0U7/2cQd/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiP/2MMa/9zILv/ezD7/3cs4/9nEH//ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/381A//799v//////////////////////6d5+/9jDGf/axib/2sYm/9rGJv/axib/2cQe/+HRTv////7//////////////////////+LSU//ZxB3/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFIv/bxyj/7uSW//v45P/+/fb//fvv//Tuu//fzkL/3co0///++//38sv/2cQe/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/28cn/+3jlP/7+OP//v32//378P/07r3/4dBK/9nEHP/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/28MX///////////////////////Lrs//ZxBv/2sYm/9rGJv/axib/2sYm/9jDGv/o23b///////////////////////z67P/cyjL/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSD/8+23////////////////////////////+/nl/+3jk///////6t5+/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2cUg//PstP////////////////////////////377//gz0X/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/7eKP///////////////////////59tz/28cn/9rGJP/axib/2sYm/9rGJv/Ywxn/7uSZ///////////////////////489D/2sUi/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/5tlr///////////////////////////////////////////////8/+HQSf/ZxR//2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+bYaP//////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYaf///////////////////////fzz/97MOv/axSH/2sYm/9rGJv/axib/2MMb//LqsP//////////////////////9O26/9jDHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe//XwxP////////////////////////////////////////////v55v/cyC3/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/177/////////////////////////////////////////+/P/gz0f/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i01T///////////////////////7++//fzkT/2cUg/9rGJv/axib/2sYm/9nEHf/07r////////////////////////Dopv/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUi/93LNv/9/PH////////////////////////////////////////////38s3/2sUh/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rFIv/dyjT//fvu////////////////////////////////////////////6dx5/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56H/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lD/////////////////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4dFO/////////////////////////////////////////////////+/mnf/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBz/5ddl//////////////////////////////////////////////////Ptuf/ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+XWY//////////////////////////////////////////////////z7LX/2cQb/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bZa//////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//n2Gn/////////////////////////////////////////////////9e68/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGP/axiX/2sYl/9rGJf/axiX/2sYl/9rGJf/Ywxr/5thq//////////////////////////////////////////////////Ptuf/YxBv/2sYl/9rGJf/axiX/2sYl/9rGJf/axiX/2MMa/+bXaP/////////////////////////////////////////////////07bv/2cQb/9rGJf/axiX/2sYl/9rGJf/axiX/2sYl/9nEHf/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/078D//////////////////////+/mn//XwRL/2cQf/9nEH//ZxB//2cQf/9nEH//ZxB//18EU/+XXZv/////////////////////////////////////////////////z7bf/18IV/9nEH//ZxB//2cQf/9nEH//ZxB//2cQf/9fBFP/l1mP/////////////////////////////////////////////////9O25/9jCFf/ZxB//2cQf/9nEH//ZxB//2cQf/9nEH//Ywhf/4dFO///////////////////////+/vv/385E/9nFIP/axib/2sYm/9rGJv/ZxBz/8+25///////////////////////7+ej/9fDE//bxyP/28cj/9vHI//bxyP/28cj/9vHI//Xwxf/59dn//////////////////////////////////////////////////Pvt//Xwxf/28cj/9vHI//bxyP/28cj/9vHI//bxyP/18MX/+fXZ//////////////////////////////////////////////////z77v/28MX/9vHI//bxyP/28cj/9vHI//bxyP/28cj/9vDG//j00////////////////////////v73/9/NP//ZxSH/2sYm/9rGJv/axib/2MMZ/+zijf/////////////////////////////////////////////////////////////////////////////////////////////////+/ff//////////////////////////////////////////////////////////////////////////////////////////////////v33//////////////////////////////////////////////////////////////////////////////////////////////////n22//bxib/2sYk/9rGJv/axib/2sYm/9nEHv/i0U/////+////////////////////////////////////////////////////////////////////////////////////////////7eOT//z66////////////////////////////////////////////////////////////////////////////////////////////+7klv/7+eb////////////////////////////////////////////////////////////////////////////////////////////v5pz/2MMa/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+3klf//////////////////////////////////////////////////////////////////////////////////////9fDD/9jDGf/p3Xz///////////////////////////////////////////////////////////////////////////////////////bxyP/ZxBv/6Nt1///////////////////////////////////////////////////////////////////////////////////////59tr/3Mkv/9rFIv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/axSH/6+CJ//378P///////////////////////////////////////////////////////////////////vz/8uqu/9zILv/ZxSD/2cQd/+ncef/8+uz////////////////////////////////////////////////////////////////////9//Lqr//cyS//2cUg/9nEHf/o3Hj//Prr/////////////////////////////////////////////////////////////////////v/07rv/3sw5/9nEHv/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYk/9jDG//ezDv/5thp/+3jkv/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kl//o3Hj/4M9I/9nEH//axSH/2sYn/9rGJf/Ywxv/3cs3/+XXZ//t45H/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jf/6dx6/+DQSv/ZxB//2cUh/9rGJ//axiX/2MMb/93LNv/l12X/7eKQ/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+ndfP/h0Ez/2sUi/9nFH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUh/9jDG//Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMa/9nEH//axiX/2sYm/9rGJv/axib/2sYm/9rFIv/Ywxv/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGv/ZxB//2sYl/9rGJv/axib/2sYm/9rGJv/axSL/2cQc/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxr/2cQf/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axibW2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibf2sYmX9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmcdrGJgDaxiaH2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmnNrGJgPaxiYA2sYmANrGJmHaxibR2sYm+trGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibX2sYmb9rGJgDaxiYAgAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAwAAAAAAAAAM=
// @match        https://wikicv.net/truyen/*
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://github.com/BaoBao666888/Novel-Downloader5/raw/refs/heads/main/tools/TruyenWikiDich_Get_Names.user.js
// @downloadURL  https://github.com/BaoBao666888/Novel-Downloader5/raw/refs/heads/main/tools/TruyenWikiDich_Get_Names.user.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const HOST_ID = 'wknm-host';
    const COOKIE_NAME = 'wkdth_bookNameList';
    const EDIT_COOKIE_NAME = 'wkdth_bookEditName';
    const COOKIE_MAX_ENTRIES = 37;
    const COOKIE_MAX_IDS = 3;
    const APP_NAME = 'WikiCV Name Desk';
    const SCRIPT_VERSION = '2.3.0';
    const STORAGE_PREFIX = 'wknm';
    const VERSION_STORAGE_KEY = `${STORAGE_PREFIX}:version`;
    const FAB_POSITION_STORAGE_KEY = `${STORAGE_PREFIX}:fab-position`;
    const GUIDE_CHECK_DELAY = 900;
    const HISTORY_RETRY_LIMIT = 3;
    const HISTORY_RETRY_BASE_DELAY = 900;

    const state = {
        host: null,
        shadow: null,
        mounted: false,
        initialized: false,
        panelOpen: false,
        guideOpen: false,
        guideMode: '',
        previousVersion: '',
        book: {
            id: '',
            title: '',
            origin: location.origin,
            url: location.href,
            bookUrl: location.href,
            editToken: '',
        },
        folders: [],
        selectedFolderId: '',
        selectedNameKey: '',
        namesCache: new Map(),
        historyCache: new Map(),
        search: '',
        statusFilter: 'all',
        sortBy: 'latest',
        isBooting: false,
        isLoadingFolders: false,
        isLoadingNames: false,
        isScanningHistory: false,
        progress: {
            current: 0,
            total: 0,
            label: '',
        },
        editor: {
            folderId: '',
            targetKey: '',
            nameCn: '',
            nameVi: '',
            nameCv: '',
            namePy: '',
            exists: false,
            checking: false,
            saving: false,
            suggestions: [],
            googleSearch: '',
            googleTranslate: '',
            addCn: '',
            addVi: '',
            bulkText: '',
        },
        deleteConfirm: {
            open: false,
            deleting: false,
            rowKey: '',
            nameCn: '',
            nameVi: '',
        },
        sidebarCollapsed: true,
        fabPosition: null,
        ignoreNextFabClick: false,
        versionChecked: false,
        info: 'Sẵn sàng',
        error: '',
    };

    function normalizeSpace(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/`/g, '&#96;');
    }

    function sanitizeFilename(name) {
        return String(name || 'unknown').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
    }

    function safeDecode(value) {
        try {
            return decodeURIComponent(value);
        } catch (error) {
            return value;
        }
    }

    function sleep(ms) {
        const delay = Math.max(0, Number(ms) || 0);
        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    }

    function pad2(value) {
        return String(Math.max(0, Number(value) || 0)).padStart(2, '0');
    }

    function formatDateText(value) {
        const date = value instanceof Date ? value : new Date(value || Date.now());
        return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
        return match ? safeDecode(match[1]) : '';
    }

    function writeCookieRaw(name, value, days) {
        const maxAge = Math.max(1, Number(days || 90)) * 24 * 60 * 60;
        document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }

    function clearCookie(name) {
        document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    }

    function extractBookTokenFromPath(pathname) {
        const raw = String(pathname || '').split(/[?#]/)[0];
        const match = raw.match(/^\/truyen\/([^/]+)$/i);
        if (!match) {
            return '';
        }
        const slug = match[1];
        const tokenMatch = slug.match(/-([A-Za-z0-9~]{8,})$/);
        return tokenMatch ? tokenMatch[1] : '';
    }

    function findBookUrlCandidate() {
        const currentToken = extractBookTokenFromPath(location.pathname);
        if (currentToken) {
            return location.href;
        }

        const candidates = [
            document.querySelector('link[rel="canonical"]')?.href || '',
            document.querySelector('meta[property="og:url"]')?.content || '',
            document.querySelector('.book-info h1 a[href*="/truyen/"]')?.href || '',
            document.querySelector('.cover-info a[href*="/truyen/"]')?.href || '',
        ].filter(Boolean);

        const linkCandidates = Array.from(document.querySelectorAll('a[href*="/truyen/"]'))
            .map((node) => node.href)
            .filter(Boolean);

        const allCandidates = candidates.concat(linkCandidates);
        for (const candidate of allCandidates) {
            try {
                const url = new URL(candidate, location.origin);
                if (extractBookTokenFromPath(url.pathname)) {
                    return url.href;
                }
            } catch (error) {
                continue;
            }
        }

        return location.href;
    }

    function findBookEditToken() {
        const bookUrl = findBookUrlCandidate();
        try {
            return extractBookTokenFromPath(new URL(bookUrl, location.origin).pathname);
        } catch (error) {
            return '';
        }
    }

    function storageGet(key, fallback) {
        try {
            if (typeof GM_getValue === 'function') {
                return GM_getValue(key, fallback);
            }
        } catch (error) {
            console.warn(`[${APP_NAME}] Không đọc được GM storage cho key ${key}:`, error);
        }

        try {
            const raw = localStorage.getItem(key);
            if (raw == null) {
                return fallback;
            }
            try {
                return JSON.parse(raw);
            } catch (error) {
                return raw;
            }
        } catch (error) {
            return fallback;
        }
    }

    function storageSet(key, value) {
        try {
            if (typeof GM_setValue === 'function') {
                GM_setValue(key, value);
                return;
            }
        } catch (error) {
            console.warn(`[${APP_NAME}] Không ghi được GM storage cho key ${key}:`, error);
        }

        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`[${APP_NAME}] Không ghi được localStorage cho key ${key}:`, error);
        }
    }

    function sanitizeFabPosition(value) {
        if (!value) {
            return null;
        }

        const left = Number(value.left);
        const top = Number(value.top);
        if (!Number.isFinite(left) || !Number.isFinite(top)) {
            return null;
        }

        return {
            left: Math.round(left),
            top: Math.round(top),
        };
    }

    function saveFabPosition(value) {
        const position = sanitizeFabPosition(value);
        state.fabPosition = position;
        storageSet(FAB_POSITION_STORAGE_KEY, position);
    }

    function getFabInlineStyle() {
        const position = sanitizeFabPosition(state.fabPosition);
        if (!position) {
            return '';
        }
        return `style="left:${position.left}px; top:${position.top}px; right:auto; bottom:auto;"`;
    }

    function splitOnce(text, separator) {
        const source = String(text || '');
        const index = source.indexOf(separator);
        if (index === -1) {
            return [source, ''];
        }
        return [source.slice(0, index), source.slice(index + separator.length)];
    }

    function parseFolderCookie(raw) {
        const map = new Map();
        const sections = String(raw || '').split('|').map((item) => item.trim()).filter(Boolean);
        sections.forEach((section) => {
            const pair = splitOnce(section, '=');
            const bookId = pair[0].trim();
            const ids = pair[1]
                ? pair[1].split(',').map((item) => item.trim()).filter(Boolean)
                : [];
            if (bookId) {
                map.set(bookId, ids);
            }
        });
        return map;
    }

    function serializeFolderCookie(map) {
        return Array.from(map.entries())
            .filter((entry) => entry[0] && Array.isArray(entry[1]) && entry[1].length)
            .slice(-COOKIE_MAX_ENTRIES)
            .map((entry) => `${entry[0]}=${entry[1].join(',')}`)
            .join('|');
    }

    function setFolderCookie(bookId, folderIds) {
        const raw = getCookie(COOKIE_NAME);
        const map = parseFolderCookie(raw);
        const ids = Array.from(new Set((Array.isArray(folderIds) ? folderIds : [folderIds]).map((item) => String(item || '').trim()).filter(Boolean))).slice(0, COOKIE_MAX_IDS);
        if (ids.length) {
            map.set(String(bookId || '').trim(), ids);
        } else {
            map.delete(String(bookId || '').trim());
        }
        const serialized = serializeFolderCookie(map);
        if (serialized) {
            writeCookieRaw(COOKIE_NAME, serialized, 90);
        } else {
            clearCookie(COOKIE_NAME);
        }
        return serialized;
    }

    async function withSelectedFoldersCookie(folderIds, work) {
        const previous = getCookie(COOKIE_NAME);
        setFolderCookie(state.book.id, folderIds);
        try {
            return await work();
        } finally {
            if (previous) {
                writeCookieRaw(COOKIE_NAME, previous, 90);
            } else {
                clearCookie(COOKIE_NAME);
            }
        }
    }

    function setInfo(message) {
        state.info = message || 'Sẵn sàng';
        if (message) {
            state.error = '';
        }
    }

    function setError(error) {
        state.error = normalizeSpace(error && error.message ? error.message : error);
    }

    function clearError() {
        state.error = '';
    }

    function compareText(a, b) {
        return String(a || '').localeCompare(String(b || ''), 'vi', { sensitivity: 'base' });
    }

    function parseHtml(html) {
        return new DOMParser().parseFromString(String(html || ''), 'text/html');
    }

    function findBookTitle() {
        const candidates = [
            document.querySelector('.cover-info h2'),
            document.querySelector('.book-info h1'),
            document.querySelector('.book-info .book-name'),
            document.querySelector('meta[property="og:title"]'),
            document.querySelector('h1'),
        ];
        for (const node of candidates) {
            const value = node && (node.content || node.textContent);
            const text = normalizeSpace(value);
            if (text) {
                return text.replace(/\s*-\s*Wiki.*$/i, '').trim();
            }
        }
        return normalizeSpace(document.title).replace(/\s*-\s*Wiki.*$/i, '').trim();
    }

    function findBookId() {
        const selectors = [
            'input#bookId',
            'input[name="bookId"]',
            '[data-book]',
        ];
        for (const selector of selectors) {
            const node = document.querySelector(selector);
            if (!node) {
                continue;
            }
            const value = node.value || node.getAttribute('data-book') || node.getAttribute('data-id');
            if (value && /^[a-z0-9]{24}$/i.test(String(value).trim())) {
                return String(value).trim();
            }
        }

        const scriptTexts = Array.from(document.scripts).map((script) => script.textContent || '');
        for (const text of scriptTexts) {
            const match = text.match(/\bbookId\s*=\s*["']([a-z0-9]{24})["']/i);
            if (match) {
                return match[1];
            }
        }

        if (typeof window.bookId === 'string' && /^[a-z0-9]{24}$/i.test(window.bookId)) {
            return window.bookId;
        }

        return '';
    }

    function detectOrigin() {
        return location.origin;
    }

    function detectBookMeta() {
        const bookUrl = findBookUrlCandidate();
        return {
            id: findBookId(),
            title: findBookTitle(),
            origin: detectOrigin(),
            url: location.href,
            bookUrl: bookUrl,
            editToken: findBookEditToken(),
        };
    }

    async function withBookEditCookie(work) {
        const previous = getCookie(EDIT_COOKIE_NAME);
        const token = String(state.book.editToken || '').trim();
        if (!token) {
            return work();
        }

        writeCookieRaw(EDIT_COOKIE_NAME, encodeURIComponent(token), 30);
        try {
            return await work();
        } finally {
            if (previous) {
                writeCookieRaw(EDIT_COOKIE_NAME, encodeURIComponent(previous), 30);
            } else {
                clearCookie(EDIT_COOKIE_NAME);
            }
        }
    }

    async function withRequestCookies(options, work) {
        const runner = async () => {
            if (options && options.folderIds && options.folderIds.length) {
                return withSelectedFoldersCookie(options.folderIds, work);
            }
            return work();
        };

        if (options && options.useEditCookie) {
            return withBookEditCookie(runner);
        }

        return runner();
    }

    async function requestText(path, params, options) {
        const url = new URL(path, state.book.origin || location.origin);
        const query = params || {};
        Object.keys(query).forEach((key) => {
            if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
                url.searchParams.set(key, String(query[key]));
            }
        });

        const execute = async () => {
            const response = await fetch(url.toString(), {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: '*/*',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(options && options.headers ? options.headers : {}),
                },
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(`Yêu cầu thất bại (${response.status}) ở ${path}`);
            }
            return text;
        };
        return withRequestCookies(options, execute);
    }

    async function requestJson(path, params, options) {
        const text = await requestText(path, params, options);
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error(`Phản hồi JSON không hợp lệ từ ${path}`);
        }
    }

    async function requestFormText(path, pairs, options) {
        const url = new URL(path, state.book.origin || location.origin);
        const body = new URLSearchParams();
        (pairs || []).forEach((pair) => {
            if (!pair || !pair.length) {
                return;
            }
            body.append(String(pair[0]), pair[1] == null ? '' : String(pair[1]));
        });

        const execute = async () => {
            const response = await fetch(url.toString(), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(options && options.headers ? options.headers : {}),
                },
                body: body.toString(),
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(`Yêu cầu thất bại (${response.status}) ở ${path}`);
            }
            return text;
        };

        return withRequestCookies(options, execute);
    }

    async function requestFormJson(path, pairs, options) {
        const text = await requestFormText(path, pairs, options);
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error(`Phản hồi JSON không hợp lệ từ ${path}`);
        }
    }

    function splitNamePair(text) {
        const source = String(text || '').trim();
        const index = source.indexOf('=');
        if (index === -1) {
            return {
                cn: source,
                vi: '',
                text: source,
            };
        }
        return {
            cn: source.slice(0, index).trim(),
            vi: source.slice(index + 1).trim(),
            text: source,
        };
    }

    function hasNamePairValue(pair) {
        return !!(pair && (pair.cn || pair.vi));
    }

    function formatNamePair(pair) {
        if (!hasNamePairValue(pair)) {
            return 'Khuyết dữ liệu';
        }
        if (pair.cn && pair.vi) {
            return `${pair.cn}=${pair.vi}`;
        }
        return pair.cn || pair.vi;
    }

    function containsCjk(text) {
        return /[\u3400-\u9fff\uf900-\ufaff]/.test(String(text || ''));
    }

    function parseHistorySide(raw, fallbackCn) {
        const text = normalizeSpace(raw);
        if (!text) {
            return {
                cn: fallbackCn || '',
                vi: '',
                text: text,
            };
        }
        if (text.includes('=')) {
            return splitNamePair(text);
        }
        if (containsCjk(text)) {
            return {
                cn: text,
                vi: '',
                text: text,
            };
        }
        return {
            cn: fallbackCn || '',
            vi: text,
            text: text,
        };
    }

    function scoreHistorySide(pair, raw, siblingCn) {
        const text = normalizeSpace(raw);
        let score = 0;
        if (!text) {
            return -8;
        }
        if (text.includes('=')) {
            score += 3;
        }
        if (pair.cn) {
            score += containsCjk(pair.cn) ? 5 : -4;
        }
        if (pair.vi) {
            score += 2;
            score += containsCjk(pair.vi) ? -3 : 1;
        }
        if (pair.cn && siblingCn && pair.cn === siblingCn) {
            score += 2;
        }
        if (!pair.cn && pair.vi) {
            score += 1;
        }
        return score;
    }

    function parseUpdateHistory(body) {
        const delimiter = ' thành ';
        const positions = [];
        let fromIndex = 0;
        while (fromIndex < body.length) {
            const index = body.indexOf(delimiter, fromIndex);
            if (index === -1) {
                break;
            }
            positions.push(index);
            fromIndex = index + delimiter.length;
        }

        if (!positions.length) {
            return null;
        }

        let best = null;
        positions.forEach((index) => {
            const beforeRaw = body.slice(0, index);
            const afterRaw = body.slice(index + delimiter.length);
            const beforeDraft = parseHistorySide(beforeRaw, '');
            const afterDraft = parseHistorySide(afterRaw, beforeDraft.cn || '');
            const before = parseHistorySide(beforeRaw, afterDraft.cn || '');
            const after = parseHistorySide(afterRaw, before.cn || '');
            const beforeHas = hasNamePairValue(before);
            const afterHas = hasNamePairValue(after);
            const beforeText = normalizeSpace(beforeRaw);
            const afterText = normalizeSpace(afterRaw);
            let score = scoreHistorySide(before, beforeRaw, after.cn) + scoreHistorySide(after, afterRaw, before.cn);

            if (beforeHas && afterHas) {
                score += 8;
            } else if (beforeHas || afterHas) {
                score += 3;
            }
            if (beforeText && afterText) {
                score += 2;
            }
            if (before.cn && after.cn && before.cn === after.cn) {
                score += 4;
            }
            if (!afterText || !beforeText) {
                score -= 2;
            }

            const candidate = {
                before: before,
                after: after,
                beforeText: beforeText,
                afterText: afterText,
                beforeHas: beforeHas,
                afterHas: afterHas,
                score: score,
            };

            if (!best || candidate.score > best.score) {
                best = candidate;
            }
        });

        return best;
    }

    function getEventPrimaryPair(event) {
        if (!event) {
            return null;
        }
        if (event.type === 'add') {
            return event.after || null;
        }
        if (event.type === 'delete') {
            return event.before || null;
        }
        return event.after || event.before || null;
    }

    function getEventNameCn(event) {
        const pair = getEventPrimaryPair(event);
        return (pair && pair.cn) || event.nameCn || '';
    }

    function areNamePairsEqual(left, right) {
        if (!left || !right) {
            return false;
        }
        const leftCn = normalizeSpace(left.cn || '');
        const rightCn = normalizeSpace(right.cn || '');
        const leftVi = normalizeSpace(left.vi || '');
        const rightVi = normalizeSpace(right.vi || '');
        return leftCn === rightCn && leftVi === rightVi;
    }

    function isMatchingRelatedEvent(editEvent, candidate, targetType) {
        if (!candidate || candidate.type !== targetType) {
            return false;
        }
        const editCn = (editEvent.before && editEvent.before.cn) || (editEvent.after && editEvent.after.cn) || editEvent.nameCn || '';
        const candidateCn = getEventNameCn(candidate);
        if (!editCn) {
            return true;
        }
        return !!candidateCn && candidateCn === editCn;
    }

    function findRelatedHistoryEvent(events, startIndex, direction, targetType, editEvent, maxDistance) {
        const limit = Math.max(1, Number(maxDistance) || 8);
        for (let distance = 1; distance <= limit; distance += 1) {
            const index = startIndex + (distance * direction);
            if (index < 0 || index >= events.length) {
                break;
            }
            const candidate = events[index];
            if (isMatchingRelatedEvent(editEvent, candidate, targetType)) {
                return candidate;
            }
        }
        return null;
    }

    function enhanceHistoryEvents(events) {
        return events.map((event, index, list) => {
            if (!event || event.type !== 'edit') {
                return event;
            }

            const prev = findRelatedHistoryEvent(list, index, -1, 'delete', event, 8);
            const next = findRelatedHistoryEvent(list, index, 1, 'add', event, 8);
            const marker = getEventPrimaryPair(event);
            const prevPair = prev ? (prev.before || null) : null;
            const nextPair = next ? (next.after || null) : null;
            let before = event.before;
            let after = event.after;

            if (marker && prevPair && areNamePairsEqual(marker, prevPair) && nextPair && !areNamePairsEqual(marker, nextPair)) {
                before = nextPair;
                after = marker;
            } else if (marker && nextPair && areNamePairsEqual(marker, nextPair) && prevPair && !areNamePairsEqual(marker, prevPair)) {
                before = marker;
                after = prevPair;
            } else {
                if ((!hasNamePairValue(before) || !before.vi) && prev) {
                    before = prev.before || before;
                }

                if ((!hasNamePairValue(after) || !after.vi) && next) {
                    const nextResolvedPair = next.after || null;
                    if (nextResolvedPair && (!before || !before.cn || !nextResolvedPair.cn || before.cn === nextResolvedPair.cn || !!prev)) {
                        after = nextResolvedPair;
                    }
                }
            }

            if ((!hasNamePairValue(after) || !after.vi) && marker) {
                after = marker;
            }
            if ((!hasNamePairValue(before) || !before.vi) && nextPair && (!marker || !areNamePairsEqual(marker, nextPair))) {
                before = nextPair;
            }
            if ((!hasNamePairValue(before) || !before.vi) && prevPair && marker && !areNamePairsEqual(marker, prevPair)) {
                before = prevPair;
            }

            return {
                ...event,
                type: 'update',
                before: before,
                after: after,
                nameCn: (after && after.cn) || (before && before.cn) || event.nameCn,
                nameVi: (after && after.vi) || (before && before.vi) || event.nameVi,
                relatedKeys: Array.from(new Set([
                    before && before.cn,
                    after && after.cn,
                    event.nameCn,
                ].filter(Boolean))),
            };
        });
    }

    function parseDateText(text) {
        const match = String(text || '').trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (!match) {
            return 0;
        }
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
    }

    function parseHistoryMessage(message) {
        const msg = normalizeSpace(message);

        if (msg.startsWith('đã thêm name ')) {
            const pair = splitNamePair(msg.slice('đã thêm name '.length));
            return {
                type: 'add',
                before: null,
                after: pair,
                nameCn: pair.cn,
                nameVi: pair.vi,
                relatedKeys: pair.cn ? [pair.cn] : [],
            };
        }

        if (msg.startsWith('đã xóa name ')) {
            const pair = splitNamePair(msg.slice('đã xóa name '.length));
            return {
                type: 'delete',
                before: pair,
                after: null,
                nameCn: pair.cn,
                nameVi: pair.vi,
                relatedKeys: pair.cn ? [pair.cn] : [],
            };
        }

        if (msg.startsWith('đã sửa name ')) {
            const body = msg.slice('đã sửa name '.length);
            const parsedUpdate = parseUpdateHistory(body);
            if (!parsedUpdate) {
                const pair = parseHistorySide(body, '');
                return {
                    type: 'edit',
                    before: hasNamePairValue(pair) ? pair : null,
                    after: null,
                    nameCn: pair.cn || '',
                    nameVi: pair.vi || '',
                    relatedKeys: pair.cn ? [pair.cn] : [],
                };
            }
            const before = parsedUpdate.before;
            const after = parsedUpdate.after;
            const beforeHas = parsedUpdate.beforeHas;
            const afterHas = parsedUpdate.afterHas;
            const beforeText = parsedUpdate.beforeText;
            const afterText = parsedUpdate.afterText;
            if (!beforeHas && !afterHas) {
                return {
                    type: 'other',
                    before: null,
                    after: null,
                    nameCn: '',
                    nameVi: '',
                    relatedKeys: [],
                };
            }
            if (beforeHas && !afterHas && !afterText) {
                return {
                    type: 'delete',
                    before: before,
                    after: null,
                    nameCn: before.cn,
                    nameVi: before.vi,
                    relatedKeys: before.cn ? [before.cn] : [],
                };
            }
            if (!beforeHas && afterHas && !beforeText) {
                return {
                    type: 'add',
                    before: null,
                    after: after,
                    nameCn: after.cn,
                    nameVi: after.vi,
                    relatedKeys: after.cn ? [after.cn] : [],
                };
            }
            const relatedKeys = Array.from(new Set([before.cn, after.cn].filter(Boolean)));
            return {
                type: 'update',
                before: before,
                after: after,
                nameCn: after.cn || before.cn,
                nameVi: after.vi || before.vi,
                relatedKeys: relatedKeys,
            };
        }

        return {
            type: 'other',
            before: null,
            after: null,
            nameCn: '',
            nameVi: '',
            relatedKeys: [],
        };
    }

    function parseHistoryPage(html, pageStart) {
        const doc = parseHtml(html);
        const rows = Array.from(doc.querySelectorAll('.report-history-list > li'));
        const events = rows.map((li, index) => {
            const dateText = normalizeSpace(li.querySelector('.report-time')?.textContent || '');
            const messageNode = li.querySelector('.report-message');
            const actorLink = messageNode ? messageNode.querySelector('a') : null;
            const actor = normalizeSpace(actorLink?.textContent || 'Không rõ');
            const actorPath = actorLink ? actorLink.getAttribute('href') || '' : '';
            const fullText = normalizeSpace(messageNode?.textContent || '');
            let message = fullText;
            if (actor && message.startsWith(actor)) {
                message = normalizeSpace(message.slice(actor.length));
            }
            const parsed = parseHistoryMessage(message);
            return {
                key: `${pageStart}-${index}`,
                pageStart: pageStart,
                order: pageStart + index,
                dateText: dateText,
                timestamp: parseDateText(dateText),
                actor: actor || 'Không rõ',
                actorPath: actorPath,
                actorUrl: actorPath ? new URL(actorPath, state.book.origin || location.origin).href : '',
                message: message,
                rawText: fullText,
                type: parsed.type,
                before: parsed.before,
                after: parsed.after,
                nameCn: parsed.nameCn,
                nameVi: parsed.nameVi,
                relatedKeys: parsed.relatedKeys,
            };
        });
        const starts = Array.from(doc.querySelectorAll('a[data-start]'))
            .map((node) => Number(node.getAttribute('data-start') || '0'))
            .filter((value) => Number.isFinite(value));
        const size = Number(doc.querySelector('a[data-size]')?.getAttribute('data-size') || '10') || 10;

        return {
            events: events,
            maxStart: starts.length ? Math.max.apply(null, starts) : 0,
            pageSize: size,
        };
    }

    function createRow(key) {
        return {
            key: key,
            nameCn: key,
            currentNames: [],
            listTypes: new Set(),
            currentVariants: new Set(),
            valueVariants: new Set(),
            events: [],
            users: new Map(),
            addCount: 0,
            deleteCount: 0,
            updateCount: 0,
            otherCount: 0,
            latestEvent: null,
            currentVi: '',
            displayVi: '',
            status: 'history',
            revisions: 0,
            userList: [],
            lastDateText: '',
            lastKnownVi: '',
            searchText: '',
            listType: '',
            canEdit: false,
            isSystemAdded: false,
        };
    }

    function attachCurrentNames(rowsMap, names) {
        names.forEach((name) => {
            const key = String(name.cn || '').trim() || String(name.vi || '').trim() || `row-${rowsMap.size + 1}`;
            if (!rowsMap.has(key)) {
                rowsMap.set(key, createRow(key));
            }
            const row = rowsMap.get(key);
            row.currentNames.push(name);
            if (name.listType) {
                row.listTypes.add(String(name.listType));
            }
            row.canEdit = row.canEdit || !!name.editable;
            if (name.vi) {
                row.currentVariants.add(name.vi);
                row.valueVariants.add(name.vi);
            }
        });
    }

    function buildHistoryRecord(folder, namesRecord, events, scannedAt) {
        const rowsMap = new Map();
        const names = namesRecord ? namesRecord.names : [];
        attachCurrentNames(rowsMap, names);

        const folderUserMap = new Map();

        events.forEach((event) => {
            folderUserMap.set(event.actor, (folderUserMap.get(event.actor) || 0) + 1);

            const relatedKeys = Array.from(new Set((event.relatedKeys && event.relatedKeys.length ? event.relatedKeys : [event.nameCn]).filter(Boolean)));
            if (!relatedKeys.length) {
                return;
            }

            relatedKeys.forEach((key) => {
                if (!rowsMap.has(key)) {
                    rowsMap.set(key, createRow(key));
                }
                const row = rowsMap.get(key);
                row.events.push(event);
                row.users.set(event.actor, (row.users.get(event.actor) || 0) + 1);

                if (!row.latestEvent) {
                    row.latestEvent = event;
                }

                if (event.type === 'add') {
                    row.addCount += 1;
                    if (event.after && event.after.vi) {
                        row.valueVariants.add(event.after.vi);
                        row.lastKnownVi = row.lastKnownVi || event.after.vi;
                    }
                } else if (event.type === 'delete') {
                    row.deleteCount += 1;
                    if (event.before && event.before.vi) {
                        row.valueVariants.add(event.before.vi);
                        row.lastKnownVi = row.lastKnownVi || event.before.vi;
                    }
                } else if (event.type === 'update') {
                    row.updateCount += 1;
                    if (event.before && event.before.vi) {
                        row.valueVariants.add(event.before.vi);
                    }
                    if (event.after && event.after.vi) {
                        row.valueVariants.add(event.after.vi);
                        row.lastKnownVi = row.lastKnownVi || event.after.vi;
                    }
                } else {
                    row.otherCount += 1;
                }
            });
        });

        const rows = Array.from(rowsMap.values()).map((row) => {
            const currentVariants = Array.from(row.currentVariants).sort(compareText);
            const valueVariants = Array.from(row.valueVariants).sort(compareText);
            const userList = Array.from(row.users.entries())
                .sort((a, b) => (b[1] - a[1]) || compareText(a[0], b[0]))
                .map((entry) => entry[0]);

            row.currentVi = currentVariants.join(' | ');
            row.displayVi = row.currentVi || valueVariants[0] || row.lastKnownVi || '';
            row.status = row.currentNames.length ? 'active' : (row.deleteCount ? 'deleted' : 'history');
            row.revisions = row.events.length;
            row.userList = userList;
            row.lastDateText = row.latestEvent ? row.latestEvent.dateText : '';
            row.lastKnownVi = row.currentVi || row.lastKnownVi || valueVariants[0] || '';
            row.listType = Array.from(row.listTypes).find(Boolean) || '';
            row.isSystemAdded = !!(row.currentNames.length && !row.events.length);
            row.searchText = normalizeSpace([
                row.nameCn,
                row.currentVi,
                row.displayVi,
                valueVariants.join(' '),
                userList.join(' '),
                row.isSystemAdded ? 'he thong system' : '',
            ].join(' ')).toLowerCase();
            return row;
        });

        rows.sort((a, b) => compareText(a.nameCn, b.nameCn));

        const topUsers = Array.from(folderUserMap.entries())
            .sort((a, b) => (b[1] - a[1]) || compareText(a[0], b[0]))
            .slice(0, 8)
            .map((entry) => ({
                name: entry[0],
                count: entry[1],
            }));

        return {
            folderId: folder.id,
            folderLabel: folder.label,
            events: events,
            rows: rows,
            scannedAt: scannedAt,
            summary: {
                currentCount: names.length,
                trackedCount: rows.length,
                deletedCount: rows.filter((row) => row.status !== 'active').length,
                eventCount: events.length,
                contributorCount: folderUserMap.size,
                topUsers: topUsers,
            },
        };
    }

    function baseRowsFromNames(namesRecord) {
        if (!namesRecord) {
            return [];
        }
        const rowsMap = new Map();
        attachCurrentNames(rowsMap, namesRecord.names);
        return Array.from(rowsMap.values()).map((row) => {
            const currentVariants = Array.from(row.currentVariants).sort(compareText);
            row.currentVi = currentVariants.join(' | ');
            row.displayVi = row.currentVi;
            row.status = 'active';
            row.revisions = 0;
            row.userList = [];
            row.lastDateText = '';
            row.lastKnownVi = row.currentVi;
            row.listType = Array.from(row.listTypes).find(Boolean) || '';
            row.searchText = normalizeSpace([row.nameCn, row.currentVi].join(' ')).toLowerCase();
            return row;
        }).sort((a, b) => compareText(a.nameCn, b.nameCn));
    }

    function getSelectedFolder() {
        return state.folders.find((folder) => folder.id === state.selectedFolderId) || null;
    }

    function getRowsForFolder(folderId) {
        const historyRecord = state.historyCache.get(folderId);
        if (historyRecord) {
            return historyRecord.rows;
        }
        return baseRowsFromNames(state.namesCache.get(folderId));
    }

    function getSelectedRows() {
        return getRowsForFolder(state.selectedFolderId);
    }

    function getSelectedRow() {
        if (!state.selectedNameKey) {
            return null;
        }
        const rows = getSelectedRows();
        return rows.find((row) => row.key === state.selectedNameKey) || null;
    }

    function getFilteredRows() {
        const rows = getSelectedRows();
        const query = normalizeSpace(state.search).toLowerCase();
        const filtered = rows.filter((row) => {
            if (state.statusFilter !== 'all' && row.status !== state.statusFilter) {
                return false;
            }
            if (!query) {
                return true;
            }
            return row.searchText.includes(query);
        });

        filtered.sort((a, b) => {
            if (state.sortBy === 'revisions') {
                return (b.revisions - a.revisions)
                    || compareText(a.nameCn, b.nameCn);
            }
            if (state.sortBy === 'contributors') {
                return (b.userList.length - a.userList.length)
                    || (b.revisions - a.revisions)
                    || compareText(a.nameCn, b.nameCn);
            }
            if (state.sortBy === 'az') {
                return compareText(a.nameCn, b.nameCn);
            }
            const aStamp = a.latestEvent ? (a.latestEvent.timestamp || 0) : 0;
            const bStamp = b.latestEvent ? (b.latestEvent.timestamp || 0) : 0;
            return (bStamp - aStamp)
                || (b.revisions - a.revisions)
                || compareText(a.nameCn, b.nameCn);
        });

        return filtered;
    }

    function syncSelectedNameKey() {
        const rows = getSelectedRows();
        if (!rows.length) {
            state.selectedNameKey = '';
            return;
        }
        if (state.selectedNameKey && !rows.some((row) => row.key === state.selectedNameKey)) {
            state.selectedNameKey = '';
        }
    }

    async function fetchFolders(force) {
        if (!force && state.folders.length) {
            return state.folders;
        }

        state.isLoadingFolders = true;
        clearError();
        setInfo('Đang tải folder name...');
        render();

        try {
            const html = await requestText('/book-name-list', { bookId: state.book.id });
            const doc = parseHtml(html);
            const folders = Array.from(doc.querySelectorAll('.name-list')).map((item, index) => {
                const input = item.querySelector('input[name="nameListId"]');
                const label = normalizeSpace(item.querySelector('.list-name p')?.textContent || `Folder ${index + 1}`);
                const countText = normalizeSpace(item.querySelector('.list-total p')?.textContent || '0');
                return {
                    id: String(input?.value || '').trim(),
                    label: label,
                    count: Number(countText.replace(/[^\d]/g, '')) || 0,
                    indiv: Number(input?.getAttribute('data-indiv') || '0') || 0,
                    checked: !!input?.checked,
                };
            }).filter((folder) => folder.id);

            if (!folders.length) {
                throw new Error('Không tìm thấy folder name. Hãy mở đúng trang truyện hoặc kiểm tra đăng nhập.');
            }

            state.folders = folders;
            if (!state.selectedFolderId || !folders.some((folder) => folder.id === state.selectedFolderId)) {
                state.selectedFolderId = (folders.find((folder) => folder.checked) || folders[0]).id;
            }

            setInfo(`Đã tải ${folders.length} folder.`);
            return folders;
        } finally {
            state.isLoadingFolders = false;
            render();
        }
    }

    async function fetchNames(folderId, force) {
        const cached = state.namesCache.get(folderId);
        if (!force && cached) {
            return cached;
        }

        state.isLoadingNames = true;
        clearError();
        setInfo('Đang tải danh sách name...');
        render();

        try {
            const payload = await requestJson('/name-list', {
                bookId: state.book.id,
                id: folderId,
            });

            if (!payload || payload.err !== 0 || !payload.data || !payload.data.content) {
                throw new Error('API name-list không trả dữ liệu hợp lệ.');
            }

            const doc = parseHtml(payload.data.content);
            const names = Array.from(doc.querySelectorAll('#listName li')).map((li, index) => {
                const cn = normalizeSpace(li.getAttribute('data-ncn') || '');
                const vi = normalizeSpace(li.getAttribute('data-nvi') || '');
                const ltRaw = normalizeSpace(li.getAttribute('data-lt') || '');
                const listType = /^\d+$/.test(ltRaw) ? ltRaw : '';
                return {
                    index: index,
                    cn: cn,
                    vi: vi,
                    lt: ltRaw,
                    listType: listType,
                    editable: normalizeSpace(li.getAttribute('data-action') || '') === 'showMdAddName',
                    text: normalizeSpace(li.textContent || `${cn}=${vi}`),
                };
            }).filter((item) => item.cn || item.vi);

            const totalText = normalizeSpace(doc.querySelector('p')?.textContent || '');
            const totalMatch = totalText.match(/(\d+)/);
            const record = {
                folderId: folderId,
                loadedAt: Date.now(),
                total: totalMatch ? Number(totalMatch[1]) : names.length,
                names: names,
                isAdmin: !!(payload.data && payload.data.is_admin),
                footerHtml: String(payload.data && payload.data.footer ? payload.data.footer : ''),
            };

            state.namesCache.set(folderId, record);

            const folder = state.folders.find((item) => item.id === folderId);
            if (folder) {
                folder.count = record.total;
            }

            const historyRecord = state.historyCache.get(folderId);
            if (historyRecord && folder) {
                state.historyCache.set(folderId, buildHistoryRecord(folder, record, historyRecord.events, historyRecord.scannedAt));
            }

            setInfo(`Đã tải ${record.total} name cho folder ${folderId}.`);
            syncSelectedNameKey();
            return record;
        } finally {
            state.isLoadingNames = false;
            render();
        }
    }

    async function requestHistoryPageWithRetry(folder, start, pageIndex, pageTotal) {
        let lastError = null;
        for (let attempt = 1; attempt <= HISTORY_RETRY_LIMIT; attempt += 1) {
            try {
                return await requestText('/history', {
                    bookId: state.book.id,
                    group: 1,
                    start: start,
                }, {
                    folderIds: [folder.id],
                });
            } catch (error) {
                lastError = error;
                if (attempt >= HISTORY_RETRY_LIMIT) {
                    break;
                }
                const delayMs = HISTORY_RETRY_BASE_DELAY * attempt;
                state.progress.label = `Đang quét lịch sử ${folder.label} (${pageIndex}/${Math.max(pageTotal || 1, 1)}), retry ${attempt}/${HISTORY_RETRY_LIMIT - 1} sau ${(delayMs / 1000).toFixed(1)}s`;
                render();
                await sleep(delayMs);
            }
        }
        throw new Error(`Quét lịch sử ${folder.label} thất bại ở trang ${start}: ${lastError && lastError.message ? lastError.message : 'Lỗi không rõ'}`);
    }

    async function scanFolderHistory(folderId, force) {
        const cached = state.historyCache.get(folderId);
        if (!force && cached) {
            return cached;
        }

        const folder = state.folders.find((item) => item.id === folderId);
        if (!folder) {
            throw new Error('Không tìm thấy folder đã chọn.');
        }

        const namesRecord = state.namesCache.get(folderId) || await fetchNames(folderId, false);
        state.isScanningHistory = true;
        state.progress = {
            current: 0,
            total: 1,
            label: `Chuẩn bị quét lịch sử ${folder.label}`,
        };
        clearError();
        render();

        try {
            const firstHtml = await requestHistoryPageWithRetry(folder, 0, 1, 1);
            const firstParsed = parseHistoryPage(firstHtml, 0);
            const pageSize = firstParsed.pageSize || 10;
            const maxStart = firstParsed.maxStart || 0;
            const pageStarts = [];
            for (let start = 0; start <= maxStart; start += pageSize) {
                pageStarts.push(start);
            }

            state.progress.total = pageStarts.length || 1;
            state.progress.current = 1;
            state.progress.label = `Đang quét lịch sử ${folder.label} (1/${state.progress.total})`;
            render();

            const events = firstParsed.events.slice();

            for (let index = 1; index < pageStarts.length; index += 1) {
                const start = pageStarts[index];
                state.progress.current = index + 1;
                state.progress.label = `Đang quét lịch sử ${folder.label} (${index + 1}/${pageStarts.length})`;
                render();
                const html = await requestHistoryPageWithRetry(folder, start, index + 1, pageStarts.length);
                const parsed = parseHistoryPage(html, start);
                events.push.apply(events, parsed.events);
            }

            const enhancedEvents = enhanceHistoryEvents(events);
            const historyRecord = buildHistoryRecord(folder, namesRecord, enhancedEvents, Date.now());
            state.historyCache.set(folderId, historyRecord);
            setInfo(`Đã quét ${historyRecord.summary.eventCount} sự kiện lịch sử cho folder ${folder.label}.`);
            syncSelectedNameKey();
            return historyRecord;
        } finally {
            state.isScanningHistory = false;
            state.progress = {
                current: 0,
                total: 0,
                label: '',
            };
            render();
        }
    }

    function createObjectUrlDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        if (typeof GM_download === 'function') {
            GM_download({
                url: url,
                name: filename,
                onload: () => {
                    setTimeout(() => URL.revokeObjectURL(url), 1500);
                },
                onerror: () => {
                    setTimeout(() => URL.revokeObjectURL(url), 1500);
                    fallbackDownload(url, filename);
                },
            });
            return;
        }
        fallbackDownload(url, filename);
    }

    function fallbackDownload(url, filename) {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    function downloadText(filename, text, mimeType) {
        const blob = new Blob([text], { type: mimeType || 'text/plain;charset=utf-8' });
        createObjectUrlDownload(blob, filename);
    }

    async function copyText(text) {
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(text);
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        throw new Error('Trình duyệt không hỗ trợ copy clipboard.');
    }

    function getNamesText(folderId) {
        const namesRecord = state.namesCache.get(folderId);
        if (!namesRecord) {
            return '';
        }
        return namesRecord.names.map((item) => `${item.cn}=${item.vi}`).join('\n');
    }

    function csvCell(value) {
        const text = String(value == null ? '' : value);
        return `"${text.replace(/"/g, '""')}"`;
    }

    function buildStatsCsv(folder, rows) {
        const headers = [
            'folder_id',
            'folder_name',
            'status',
            'system_added',
            'name_cn',
            'name_vi_hien_tai',
            'name_vi_hien_thi',
            'tong_su_kien',
            'so_lan_them',
            'so_lan_xoa',
            'so_lan_sua',
            'nguoi_tham_gia',
            'ngay_gan_nhat',
        ];

        const lines = [headers.map(csvCell).join(',')];
        rows.forEach((row) => {
            lines.push([
                folder.id,
                folder.label,
                row.status,
                row.isSystemAdded ? '1' : '0',
                row.nameCn,
                row.currentVi,
                row.displayVi,
                row.revisions,
                row.addCount,
                row.deleteCount,
                row.updateCount,
                row.userList.join('; '),
                row.lastDateText,
            ].map(csvCell).join(','));
        });
        return lines.join('\n');
    }

    function exportStatsJson(folder, rows) {
        const historyRecord = state.historyCache.get(folder.id);
        const payload = {
            app: APP_NAME,
            exported_at: new Date().toISOString(),
            book: {
                id: state.book.id,
                title: state.book.title,
                url: state.book.url,
            },
            folder: {
                id: folder.id,
                label: folder.label,
                count: folder.count,
            },
            summary: historyRecord ? historyRecord.summary : null,
            rows: rows.map((row) => ({
                key: row.key,
                status: row.status,
                system_added: row.isSystemAdded,
                name_cn: row.nameCn,
                current_vi: row.currentVi,
                display_vi: row.displayVi,
                revisions: row.revisions,
                add_count: row.addCount,
                delete_count: row.deleteCount,
                update_count: row.updateCount,
                users: row.userList,
                last_date: row.lastDateText,
                events: row.events.map((event) => ({
                    type: event.type,
                    actor: event.actor,
                    actor_url: event.actorUrl,
                    date: event.dateText,
                    message: event.message,
                    before: event.before,
                    after: event.after,
                })),
            })),
        };
        return JSON.stringify(payload, null, 2);
    }

    function statusLabel(status) {
        if (status === 'active') {
            return 'Đang có';
        }
        if (status === 'deleted') {
            return 'Đã xóa';
        }
        return 'Lịch sử';
    }

    function eventTypeLabel(type) {
        if (type === 'add') {
            return 'Thêm';
        }
        if (type === 'delete') {
            return 'Xóa';
        }
        if (type === 'update') {
            return 'Sửa';
        }
        return 'Khác';
    }

    function guideTitle() {
        if (state.guideMode === 'welcome') {
            return 'Chào mừng đến với Name Desk';
        }
        if (state.guideMode === 'update') {
            return 'Bản cập nhật mới của Name Desk';
        }
        return 'Hướng dẫn nhanh';
    }

    function guideMetaText() {
        if (state.guideMode === 'update') {
            return `Từ ${state.previousVersion || 'bản cũ'} lên ${SCRIPT_VERSION}`;
        }
        return `Phiên bản ${SCRIPT_VERSION}`;
    }

    function buildGuideContent() {
        if (state.guideMode === 'update') {
            return `
                <div class="wknm-guide-section">
                    <h3>Điểm mới trong bản ${escapeHtml(SCRIPT_VERSION)}</h3>
                    <ul class="wknm-guide-list">
                        <li>Float button giờ có thể kéo thả và sẽ nhớ vị trí sau khi tải lại trang.</li>
                        <li>Font, chữ và nút đã thu gọn hơn để hợp màn hình nhỏ và hiển thị tiếng Việt gọn hơn.</li>
                        <li>Scrollbar của panel, bảng name và popup hướng dẫn đã được làm lại để đỡ thô hơn.</li>
                        <li>Thêm nút <strong>?</strong> để mở hướng dẫn bất kỳ lúc nào mà không phải nhớ flow.</li>
                        <li>Thêm form add 1/add nhiều name, gợi ý name, sửa name và popup xác nhận khi xóa.</li>
                        <li>Add/sửa/xóa thành công sẽ cập nhật ngay dữ liệu hiện tại; quét history có retry; name không có event sẽ được đánh dấu là <strong>Hệ thống</strong>.</li>
                        <li>Sidebar folder mặc định được thu gọn; dùng tay nắm ở mép trái để mở/đóng nhanh, và nút <strong>+ Name</strong> trên header để nhảy thẳng tới khối thêm name.</li>
                    </ul>
                </div>
                <div class="wknm-guide-section">
                    <h3>Mẹo dùng nhanh</h3>
                    <ul class="wknm-guide-list">
                        <li>Chọn folder ở cột trái, bấm <strong>Quét lịch sử</strong>, rồi click từng name để xem timeline chi tiết.</li>
                        <li>Dùng <strong>Copy</strong>, <strong>Tải TXT</strong>, <strong>Tải CSV</strong> hoặc <strong>Tải JSON</strong> ngay trên thanh header.</li>
                        <li>Nếu thiếu chỗ hiển thị, kéo icon nổi ra góc khác rồi mở lại panel.</li>
                    </ul>
                </div>
            `;
        }

        return `
            <div class="wknm-guide-section">
                <h3>Script này làm gì</h3>
                <p>Name Desk giúp bạn xem danh sách folder name, copy/tải list name, quét lịch sử chỉnh sửa và đọc lại timeline theo từng name ngay trên trang truyện của <code>wikicv.net</code>.</p>
            </div>
            <div class="wknm-guide-section">
                <h3>Flow gợi ý</h3>
                <ul class="wknm-guide-list">
                    <li>Mở panel bằng icon nổi ở góc màn hình. Có thể kéo icon đó sang vị trí khác nếu che nội dung.</li>
                    <li>Chọn folder cần xem ở cột trái để tải danh sách name hiện tại.</li>
                    <li>Bấm <strong>Quét lịch sử</strong> để gom log sửa name của folder đó.</li>
                        <li>Click vào từng dòng name để xem user đã thêm, xóa, sửa và các biến thể từng xuất hiện.</li>
                        <li>Nếu có quyền admin, bạn có thể thêm name ở tổng quan folder và sửa/xóa ngay trong panel chi tiết.</li>
                        <li>Xuất nhanh dữ liệu bằng TXT, CSV hoặc JSON tùy mục đích đối soát.</li>
                    </ul>
                </div>
            <div class="wknm-guide-note">
                <strong>Tip:</strong> nút <strong>?</strong> trong header sẽ mở lại bảng hướng dẫn này bất cứ lúc nào.
            </div>
        `;
    }

    function renderGuideModal() {
        const title = guideTitle();
        return `
            <div class="wknm-guide${state.guideOpen ? ' is-open' : ''}">
                <div class="wknm-guide-backdrop" data-action="close-guide"></div>
                <div class="wknm-guide-card" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
                    <div class="wknm-guide-head">
                        <div class="wknm-guide-kicker">${state.guideMode === 'update' ? 'Update Notes' : 'Quick Guide'}</div>
                        <h3 class="wknm-guide-title">${escapeHtml(title)}</h3>
                        <div class="wknm-guide-meta">
                            <span class="wknm-guide-badge">${escapeHtml(guideMetaText())}</span>
                        </div>
                    </div>
                    <div class="wknm-guide-body">
                        ${buildGuideContent()}
                    </div>
                    <div class="wknm-guide-actions">
                        ${state.panelOpen ? '' : `<button type="button" class="wknm-btn is-ghost" data-action="open-panel">Mở Name Desk</button>`}
                        <button type="button" class="wknm-btn is-accent" data-action="close-guide">Đóng</button>
                    </div>
                </div>
            </div>
        `;
    }

    function openGuide(mode) {
        state.guideMode = mode || 'help';
        state.guideOpen = true;
        render();
    }

    function closeGuide() {
        if (!state.guideOpen) {
            return;
        }
        state.guideOpen = false;
        render();
    }

    function runVersionCheck() {
        if (state.versionChecked) {
            return;
        }
        state.versionChecked = true;

        const storedVersion = storageGet(VERSION_STORAGE_KEY, null);
        if (!storedVersion) {
            state.previousVersion = '';
            state.guideMode = 'welcome';
            state.guideOpen = true;
            storageSet(VERSION_STORAGE_KEY, SCRIPT_VERSION);
            render();
            return;
        }

        if (storedVersion !== SCRIPT_VERSION) {
            state.previousVersion = String(storedVersion);
            state.guideMode = 'update';
            state.guideOpen = true;
            storageSet(VERSION_STORAGE_KEY, SCRIPT_VERSION);
            render();
            return;
        }

        storageSet(VERSION_STORAGE_KEY, SCRIPT_VERSION);
    }

    function syncFabButtonToViewport(persist) {
        if (!state.shadow || !state.fabPosition) {
            return;
        }

        const button = state.shadow.querySelector('.wknm-fab');
        if (!button) {
            return;
        }

        const rect = button.getBoundingClientRect();
        const margin = 8;
        const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
        const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
        const nextPosition = {
            left: Math.min(Math.max(margin, state.fabPosition.left), maxLeft),
            top: Math.min(Math.max(margin, state.fabPosition.top), maxTop),
        };

        button.style.left = `${nextPosition.left}px`;
        button.style.top = `${nextPosition.top}px`;
        button.style.right = 'auto';
        button.style.bottom = 'auto';

        if (nextPosition.left !== state.fabPosition.left || nextPosition.top !== state.fabPosition.top) {
            state.fabPosition = nextPosition;
            if (persist) {
                storageSet(FAB_POSITION_STORAGE_KEY, nextPosition);
            }
        }
    }

    function progressPercent() {
        if (!state.progress.total) {
            return 0;
        }
        return Math.max(0, Math.min(100, Math.round((state.progress.current / state.progress.total) * 100)));
    }

    function renderStatusText() {
        if (state.error) {
            return `<span class="wknm-status-text is-error">${escapeHtml(state.error)}</span>`;
        }
        if (state.isScanningHistory) {
            return `<span class="wknm-status-text is-accent">${escapeHtml(state.progress.label || 'Đang quét lịch sử...')}</span>`;
        }
        if (state.isBooting || state.isLoadingFolders || state.isLoadingNames) {
            return `<span class="wknm-status-text is-muted">${escapeHtml(state.info || 'Đang tải dữ liệu...')}</span>`;
        }
        return `<span class="wknm-status-text is-ok">${escapeHtml(state.info || 'Sẵn sàng')}</span>`;
    }

    function renderFolderCards() {
        if (!state.folders.length) {
            return `<div class="wknm-empty-box">Chưa có folder. Mở panel trên trang truyện rồi bấm tải lại.</div>`;
        }

        return state.folders.map((folder) => {
            const history = state.historyCache.get(folder.id);
            const names = state.namesCache.get(folder.id);
            const isActive = folder.id === state.selectedFolderId;
            const status = history
                ? `${history.summary.eventCount} sự kiện`
                : (names ? `${names.total} name` : 'Chưa tải');
            const badge = history ? 'Đã quét' : (names ? 'Đã tải' : 'Mới');
            return `
                <button type="button" class="wknm-folder-card${isActive ? ' is-active' : ''}" data-action="select-folder" data-folder-id="${escapeAttr(folder.id)}">
                    <div class="wknm-folder-head">
                        <span class="wknm-folder-title">${escapeHtml(folder.label)}</span>
                        <span class="wknm-folder-badge">${escapeHtml(badge)}</span>
                    </div>
                    <div class="wknm-folder-meta">${escapeHtml(folder.id)}</div>
                    <div class="wknm-folder-submeta">
                        <span>${escapeHtml(String(folder.count || 0))} name</span>
                        <span>${escapeHtml(status)}</span>
                    </div>
                </button>
            `;
        }).join('');
    }

    function renderTableRows(rows) {
        if (!rows.length) {
            return `<div class="wknm-empty-table">Không có name nào khớp bộ lọc hiện tại.</div>`;
        }

        return rows.map((row) => {
            const selected = row.key === state.selectedNameKey;
            const userPreview = row.userList.length
                ? (row.userList.slice(0, 2).join(', ') + (row.userList.length > 2 ? ` +${row.userList.length - 2}` : ''))
                : (row.isSystemAdded ? 'Hệ thống' : 'Chưa quét');
            const userTitle = row.userList.length
                ? row.userList.join(', ')
                : (row.isSystemAdded ? 'Name hiện có nhưng không có sự kiện nào trong history đã quét, khả năng cao do hệ thống thêm.' : 'Chưa quét lịch sử');
            return `
                <button type="button" class="wknm-table-row${selected ? ' is-selected' : ''}" data-action="select-name" data-name-key="${escapeAttr(row.key)}">
                    <div class="wknm-cell wknm-cell-name">
                        <span class="wknm-name-cn">${escapeHtml(row.nameCn)}</span>
                        <span class="wknm-name-vi">${escapeHtml(row.displayVi || 'Chưa có tên Việt')}</span>
                    </div>
                    <div class="wknm-cell">
                        <span class="wknm-status-pill is-${escapeAttr(row.status)}">${escapeHtml(statusLabel(row.status))}</span>
                    </div>
                    <div class="wknm-cell wknm-cell-num">${escapeHtml(String(row.revisions || 0))}</div>
                    <div class="wknm-cell wknm-cell-users" title="${escapeAttr(userTitle)}">${escapeHtml(userPreview)}</div>
                    <div class="wknm-cell wknm-cell-date">${escapeHtml(row.lastDateText || 'Chưa quét')}</div>
                </button>
            `;
        }).join('');
    }

    function renderUserChips(items) {
        if (!items || !items.length) {
            return `<div class="wknm-empty-box">Chưa có dữ liệu user.</div>`;
        }

        return `<div class="wknm-chip-list">${items.map((item) => `
            <span class="wknm-chip" title="${escapeAttr(`${item.name}: ${item.count || 0} lần`)}">${escapeHtml(item.name)}<em>${escapeHtml(String(item.count || 0))}</em></span>
        `).join('')}</div>`;
    }

    function renderPermissionNotice(folder) {
        const record = folder ? state.namesCache.get(folder.id) : null;
        if (!record) {
            return `<div class="wknm-empty-box">Tải danh sách name trước để kiểm tra quyền sửa folder này.</div>`;
        }
        if (record.isAdmin) {
            return `<div class="wknm-permission-box is-admin">Bạn có quyền thêm, sửa, xóa name ở folder này.</div>`;
        }
        return `<div class="wknm-permission-box is-view">Folder này chỉ có quyền xem. Script sẽ ẩn các thao tác thêm/sửa/xóa.</div>`;
    }

    function renderAddNamePanel(folder) {
        const record = folder ? state.namesCache.get(folder.id) : null;
        if (!record || !record.isAdmin) {
            return '';
        }

        return `
            <div class="wknm-detail-block">
                <div class="wknm-section-title">Thêm name</div>
                <div class="wknm-editor-card">
                    <div class="wknm-editor-grid">
                        <div class="wknm-field">
                            <label class="wknm-field-label">Name CN</label>
                            <input class="wknm-input" data-input="add-cn" value="${escapeAttr(state.editor.addCn)}" placeholder="Ví dụ: 护卫长" />
                        </div>
                        <div class="wknm-field">
                            <label class="wknm-field-label">Name VI</label>
                            <input class="wknm-input" data-input="add-vi" value="${escapeAttr(state.editor.addVi)}" placeholder="Ví dụ: Hộ vệ trưởng" />
                        </div>
                    </div>
                    <div class="wknm-editor-actions">
                        <button type="button" class="wknm-btn is-accent" data-action="add-single">Thêm 1 name</button>
                    </div>
                    <div class="wknm-field">
                        <label class="wknm-field-label">Thêm hàng loạt</label>
                        <textarea class="wknm-textarea" data-input="bulk-names" placeholder="Mỗi dòng: CN=VI&#10;护卫长=Hộ vệ trưởng&#10;许先生=Hứa tiên sinh">${escapeHtml(state.editor.bulkText)}</textarea>
                    </div>
                    <div class="wknm-help">
                        <p>Bulk add nhận mỗi dòng theo dạng <strong>CN=VI</strong> hoặc <strong>CN[TAB]VI</strong>.</p>
                    </div>
                    <div class="wknm-editor-actions">
                        <button type="button" class="wknm-btn" data-action="add-bulk">Thêm hàng loạt</button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderSummaryPanel(folder, rows) {
        const historyRecord = folder ? state.historyCache.get(folder.id) : null;
        const activeCount = rows.filter((row) => row.status === 'active').length;
        const deletedCount = rows.filter((row) => row.status === 'deleted').length;
        const trackedCount = rows.length;
        const stats = [
            { label: 'Đang có', value: activeCount },
            { label: 'Đã xóa', value: deletedCount },
            { label: 'Theo dõi', value: trackedCount },
            { label: 'Sự kiện', value: historyRecord ? historyRecord.summary.eventCount : 0 },
        ];

        return `
            <div class="wknm-detail-block">
                <div class="wknm-section-title">Tổng quan folder</div>
                <div class="wknm-stat-grid">
                    ${stats.map((item) => `
                        <div class="wknm-stat-card">
                            <strong>${escapeHtml(String(item.value))}</strong>
                            <span>${escapeHtml(item.label)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="wknm-detail-block">
                <div class="wknm-section-title">Quyền folder</div>
                ${renderPermissionNotice(folder)}
            </div>
            ${renderAddNamePanel(folder)}
            <div class="wknm-detail-block">
                <div class="wknm-section-title">Top user</div>
                ${historyRecord ? renderUserChips(historyRecord.summary.topUsers) : `<div class="wknm-empty-box">Chưa quét lịch sử cho folder này.</div>`}
            </div>
            <div class="wknm-detail-block">
                <div class="wknm-section-title">Gợi ý</div>
                <div class="wknm-help">
                    <p>Bấm <strong>Quét lịch sử</strong> để gom toàn bộ lịch sử sửa name của folder hiện tại.</p>
                    <p>Bấm vào từng dòng name để xem timeline chi tiết, user tham gia và biến thể đã từng xuất hiện.</p>
                    <p>Nút <strong>Tải CSV</strong> và <strong>Tải JSON</strong> sẽ xuất bảng thống kê của folder đang mở.</p>
                    <p>Name đang tồn tại nhưng không có event nào sau khi quét full history sẽ được xem là name do hệ thống thêm.</p>
                </div>
            </div>
        `;
    }

    function renderEventBody(event) {
        if (event.type === 'update') {
            return `
                <div class="wknm-event-pair is-before">
                    <label>Trước</label>
                    <div>${escapeHtml(event.before ? formatNamePair(event.before) : event.message)}</div>
                </div>
                <div class="wknm-event-pair is-after">
                    <label>Sau</label>
                    <div>${escapeHtml(event.after ? formatNamePair(event.after) : event.message)}</div>
                </div>
            `;
        }

        const pair = event.after || event.before;
        if (pair && (pair.cn || pair.vi)) {
            return `
                <div class="wknm-event-pair is-after">
                    <label>Giá trị</label>
                    <div>${escapeHtml(formatNamePair(pair))}</div>
                </div>
            `;
        }

        return `<div class="wknm-event-raw">${escapeHtml(event.message)}</div>`;
    }

    function renderDetailPanel(row) {
        if (!row) {
            return `<div class="wknm-empty-box">Chọn một name để xem chi tiết.</div>`;
        }

        const namesRecord = getSelectedNamesRecord();
        const canAdminEdit = !!(namesRecord && namesRecord.isAdmin);

        const variants = Array.from(new Set([row.currentVi, row.displayVi].filter(Boolean))).concat(
            Array.from(new Set(
                row.events.flatMap((event) => {
                    const values = [];
                    if (event.before && event.before.vi) {
                        values.push(event.before.vi);
                    }
                    if (event.after && event.after.vi) {
                        values.push(event.after.vi);
                    }
                    return values;
                })
            )).filter(Boolean)
        ).filter((value, index, array) => array.indexOf(value) === index);

        const userChips = row.userList.map((name) => ({
            name: name,
            count: row.users.get(name) || 0,
        }));
        const userSection = row.isSystemAdded && !userChips.length
            ? `<div class="wknm-empty-box">Name này đang tồn tại nhưng không có sự kiện nào trong toàn bộ history đã quét. Khả năng cao đây là name do hệ thống thêm.</div>`
            : renderUserChips(userChips);
        const timelineSection = row.events.length
            ? `<div class="wknm-event-list">${row.events.map((event) => `
                    <div class="wknm-event-card is-${escapeAttr(event.type)}" title="${escapeAttr(event.rawText)}">
                        <div class="wknm-event-head">
                            <span class="wknm-event-type is-${escapeAttr(event.type)}">${escapeHtml(eventTypeLabel(event.type))}</span>
                            <span class="wknm-event-date">${escapeHtml(event.dateText || 'Không rõ ngày')}</span>
                        </div>
                        <div class="wknm-event-user">
                            ${event.actorUrl ? `<a href="${escapeAttr(event.actorUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(event.actor)}</a>` : escapeHtml(event.actor)}
                        </div>
                        <div class="wknm-event-body">
                            ${renderEventBody(event)}
                        </div>
                    </div>
                `).join('')}</div>`
            : (row.isSystemAdded
                ? `<div class="wknm-empty-box">Name này không có event nào trong history đã quét. Script đang xem đây là name do hệ thống thêm.</div>`
                : `<div class="wknm-empty-box">Name này chưa có lịch sử hoặc bạn chưa quét folder.</div>`);

        return `
            <div class="wknm-detail-block">
                <div class="wknm-detail-topbar">
                    <div class="wknm-section-title">Chi tiết name</div>
                    <button type="button" class="wknm-detail-link" data-action="show-summary">Tổng quan folder</button>
                </div>
                <div class="wknm-detail-title">${escapeHtml(row.nameCn)}</div>
                <div class="wknm-detail-subtitle">${escapeHtml(row.displayVi || 'Chưa có tên Việt')}</div>
                <div class="wknm-pill-row">
                    <span class="wknm-status-pill is-${escapeAttr(row.status)}">${escapeHtml(statusLabel(row.status))}</span>
                    <span class="wknm-metric-pill">${escapeHtml(String(row.revisions || 0))} sự kiện</span>
                    <span class="wknm-metric-pill">${escapeHtml(String(row.userList.length || 0))} user</span>
                    ${row.isSystemAdded ? `<span class="wknm-metric-pill">Hệ thống</span>` : ''}
                </div>
            </div>
            <div class="wknm-detail-block">
                <div class="wknm-section-title">Sửa name</div>
                ${!canAdminEdit ? `<div class="wknm-empty-box">Bạn không có quyền sửa name trong folder này.</div>` : (!row.canEdit || row.status !== 'active') ? `<div class="wknm-empty-box">Chỉ name đang tồn tại và có quyền admin mới sửa/xóa trực tiếp được.</div>` : `
                    <div class="wknm-editor-card">
                        <div class="wknm-editor-grid">
                            <div class="wknm-field">
                                <label class="wknm-field-label">Name CN</label>
                                <input class="wknm-input" value="${escapeAttr(state.editor.nameCn)}" disabled />
                            </div>
                            <div class="wknm-field">
                                <label class="wknm-field-label">Name VI</label>
                                <input class="wknm-input" data-input="edit-name-vi" value="${escapeAttr(state.editor.nameVi)}" placeholder="Nhập hoặc chọn gợi ý..." />
                            </div>
                        </div>
                        <div class="wknm-meta-grid">
                            <div class="wknm-meta-card">
                                <strong>CV</strong>
                                <span>${escapeHtml(state.editor.nameCv || 'Chưa lấy')}</span>
                            </div>
                            <div class="wknm-meta-card">
                                <strong>Pinyin</strong>
                                <span>${escapeHtml(state.editor.namePy || 'Chưa lấy')}</span>
                            </div>
                            <div class="wknm-meta-card">
                                <strong>Trạng thái check</strong>
                                <span>${state.editor.exists ? 'Name đã tồn tại trên hệ thống' : 'Chưa check hoặc chưa có dữ liệu'}</span>
                            </div>
                        </div>
                        ${state.editor.suggestions.length ? `
                            <div class="wknm-field">
                                <label class="wknm-field-label">Gợi ý name</label>
                                <div class="wknm-suggestion-list">
                                    ${state.editor.suggestions.map((item) => `<button type="button" class="wknm-suggestion-item" data-action="pick-suggestion" data-suggestion="${escapeAttr(item)}">${escapeHtml(item)}</button>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${(state.editor.googleSearch || state.editor.googleTranslate) ? `
                            <div class="wknm-link-row">
                                ${state.editor.googleSearch ? `<a class="wknm-link-chip" href="${escapeAttr(state.editor.googleSearch)}" target="_blank" rel="noopener noreferrer">Google Search</a>` : ''}
                                ${state.editor.googleTranslate ? `<a class="wknm-link-chip" href="${escapeAttr(state.editor.googleTranslate)}" target="_blank" rel="noopener noreferrer">Google Translate</a>` : ''}
                            </div>
                        ` : ''}
                        <div class="wknm-editor-actions">
                            <button type="button" class="wknm-btn is-ghost" data-action="check-name"${state.editor.checking ? ' disabled' : ''}>${state.editor.checking ? 'Đang lấy gợi ý...' : 'Lấy gợi ý'}</button>
                            <button type="button" class="wknm-btn is-accent" data-action="save-name"${state.editor.saving ? ' disabled' : ''}>${state.editor.saving ? 'Đang lưu...' : 'Lưu sửa'}</button>
                            <button type="button" class="wknm-btn is-danger" data-action="confirm-delete">Xóa name</button>
                        </div>
                    </div>
                `}
            </div>
            <div class="wknm-detail-block">
                <div class="wknm-section-title">Biến thể đã thấy</div>
                ${variants.length ? `<div class="wknm-variant-list">${variants.map((item) => `<span class="wknm-variant">${escapeHtml(item)}</span>`).join('')}</div>` : `<div class="wknm-empty-box">Chưa có biến thể.</div>`}
            </div>
            <div class="wknm-detail-block">
                <div class="wknm-section-title">User tham gia</div>
                ${userSection}
            </div>
            <div class="wknm-detail-block">
                <div class="wknm-section-title">Timeline</div>
                ${timelineSection}
            </div>
        `;
    }

    function renderDeleteConfirmModal() {
        if (!state.deleteConfirm.open) {
            return '';
        }
        return `
            <div class="wknm-confirm is-open">
                <div class="wknm-confirm-backdrop" data-action="cancel-delete"></div>
                <div class="wknm-confirm-card" role="dialog" aria-modal="true" aria-label="Xác nhận xóa name">
                    <div class="wknm-confirm-kicker">Cảnh báo</div>
                    <h3 class="wknm-confirm-title">Xóa name này?</h3>
                    <div class="wknm-confirm-body">
                        <p><strong>${escapeHtml(state.deleteConfirm.nameCn)}</strong></p>
                        <p>${escapeHtml(state.deleteConfirm.nameVi || 'Chưa có name Việt')}</p>
                        <p>Thao tác này sẽ gửi lệnh xóa name lên WikiCV. Script sẽ cập nhật ngay dữ liệu hiện tại nếu xóa thành công.</p>
                    </div>
                    <div class="wknm-confirm-actions">
                        <button type="button" class="wknm-btn is-ghost" data-action="cancel-delete"${state.deleteConfirm.deleting ? ' disabled' : ''}>Hủy</button>
                        <button type="button" class="wknm-btn is-danger" data-action="delete-name"${state.deleteConfirm.deleting ? ' disabled' : ''}>${state.deleteConfirm.deleting ? 'Đang xóa...' : 'Xác nhận xóa'}</button>
                    </div>
                </div>
            </div>
        `;
    }

    function captureRenderState() {
        if (!state.shadow) {
            return null;
        }

        const sidebar = state.shadow.querySelector('.wknm-sidebar');
        const main = state.shadow.querySelector('.wknm-main');
        const detail = state.shadow.querySelector('.wknm-detail');
        const tableBody = state.shadow.querySelector('.wknm-table-body');
        const activeElement = state.shadow.activeElement;
        const searchInput = activeElement && activeElement.matches && activeElement.matches('[data-input="search"]')
            ? {
                selectionStart: typeof activeElement.selectionStart === 'number' ? activeElement.selectionStart : null,
                selectionEnd: typeof activeElement.selectionEnd === 'number' ? activeElement.selectionEnd : null,
            }
            : null;

        return {
            sidebarScrollTop: sidebar ? sidebar.scrollTop : 0,
            mainScrollTop: main ? main.scrollTop : 0,
            detailScrollTop: detail ? detail.scrollTop : 0,
            tableScrollTop: tableBody ? tableBody.scrollTop : 0,
            searchInput: searchInput,
        };
    }

    function restoreRenderState(viewState) {
        if (!state.shadow || !viewState) {
            return;
        }

        const sidebar = state.shadow.querySelector('.wknm-sidebar');
        const main = state.shadow.querySelector('.wknm-main');
        const detail = state.shadow.querySelector('.wknm-detail');
        const tableBody = state.shadow.querySelector('.wknm-table-body');
        if (sidebar) {
            sidebar.scrollTop = viewState.sidebarScrollTop || 0;
        }
        if (main) {
            main.scrollTop = viewState.mainScrollTop || 0;
        }
        if (detail) {
            detail.scrollTop = viewState.detailScrollTop || 0;
        }
        if (tableBody) {
            tableBody.scrollTop = viewState.tableScrollTop || 0;
        }

        if (viewState.searchInput) {
            const input = state.shadow.querySelector('[data-input="search"]');
            if (input) {
                input.focus();
                if (typeof input.setSelectionRange === 'function'
                    && viewState.searchInput.selectionStart !== null
                    && viewState.searchInput.selectionEnd !== null) {
                    input.setSelectionRange(viewState.searchInput.selectionStart, viewState.searchInput.selectionEnd);
                }
            }
        }
    }

    function render() {
        if (!state.shadow) {
            return;
        }

        const viewState = captureRenderState();
        const selectedFolder = getSelectedFolder();
        const rows = getFilteredRows();
        const currentRows = getSelectedRows();
        const selectedRow = getSelectedRow();
        const namesRecord = selectedFolder ? state.namesCache.get(selectedFolder.id) : null;
        const historyRecord = selectedFolder ? state.historyCache.get(selectedFolder.id) : null;
        syncEditorState(selectedFolder, selectedRow);
        const isBusy = state.isBooting || state.isLoadingFolders || state.isLoadingNames || state.isScanningHistory;
        const namesDisabled = !selectedFolder || (!namesRecord && state.isLoadingNames);
        const statsDisabled = !selectedFolder || (!historyRecord && !currentRows.length);
        state.shadow.innerHTML = `
            <style>
                :host, * {
                    box-sizing: border-box;
                }
                .wknm-root {
                    font-family: Tahoma, "Segoe UI", Arial, "Noto Sans", sans-serif;
                    font-size: 13px;
                    line-height: 1.45;
                    color: #203046;
                    --wknm-scroll-track: rgba(226, 232, 240, 0.82);
                    --wknm-scroll-thumb: rgba(56, 189, 248, 0.72);
                    --wknm-scroll-thumb-hover: rgba(14, 165, 233, 0.88);
                }
                .wknm-fab {
                    position: fixed;
                    right: 22px;
                    bottom: 22px;
                    z-index: 2147483000;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 13px;
                    border: 0;
                    border-radius: 999px;
                    cursor: pointer;
                    background: linear-gradient(135deg, #4fc3f7 0%, #0ea5e9 48%, #2563eb 100%);
                    color: #fff;
                    box-shadow: 0 18px 38px rgba(14, 165, 233, 0.34);
                    font: inherit;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    transition: transform 0.18s ease, box-shadow 0.18s ease;
                    user-select: none;
                    -webkit-user-select: none;
                    touch-action: none;
                    font-size: 12px;
                }
                .wknm-fab:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 22px 42px rgba(37, 99, 235, 0.34);
                }
                .wknm-fab-icon {
                    width: 18px;
                    height: 18px;
                    display: inline-flex;
                }
                .wknm-fab::before {
                    content: "";
                    position: absolute;
                    inset: -5px;
                    border-radius: 999px;
                    border: 2px solid rgba(191, 235, 255, 0.75);
                    opacity: 0.55;
                    pointer-events: none;
                    animation: wknm-pulse 1.9s ease-in-out infinite;
                }
                .wknm-fab-label {
                    white-space: nowrap;
                    font-size: 12px;
                }
                .wknm-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 2147482999;
                    display: none;
                }
                .wknm-overlay.is-open {
                    display: block;
                }
                .wknm-backdrop {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 36%),
                        radial-gradient(circle at right center, rgba(59, 130, 246, 0.15), transparent 32%),
                        rgba(15, 23, 42, 0.56);
                    backdrop-filter: blur(4px);
                }
                .wknm-dialog {
                    position: absolute;
                    inset: 18px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border-radius: 24px;
                    background:
                        linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,250,255,0.98)),
                        #fff;
                    box-shadow: 0 30px 60px rgba(15, 23, 42, 0.26);
                    border: 1px solid rgba(148, 163, 184, 0.22);
                }
                .wknm-header {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 18px 20px 14px;
                    border-bottom: 1px solid rgba(203, 213, 225, 0.65);
                    background:
                        radial-gradient(circle at left top, rgba(125, 211, 252, 0.20), transparent 40%),
                        linear-gradient(135deg, rgba(239, 246, 255, 0.92), rgba(255, 255, 255, 0.96));
                }
                .wknm-title-wrap {
                    min-width: 0;
                }
                .wknm-kicker {
                    margin-bottom: 5px;
                    color: #0f766e;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }
                .wknm-title {
                    margin: 0;
                    font-size: 22px;
                    line-height: 1.18;
                    color: #10233a;
                }
                .wknm-subtitle {
                    margin-top: 7px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px 12px;
                    color: #4b5d74;
                    font-size: 12px;
                }
                .wknm-subtitle code {
                    padding: 2px 7px;
                    border-radius: 999px;
                    background: rgba(14, 165, 233, 0.11);
                    color: #0369a1;
                }
                .wknm-header-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    align-items: flex-start;
                    justify-content: flex-end;
                }
                .wknm-btn,
                .wknm-select,
                .wknm-input {
                    font: inherit;
                }
                .wknm-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 12px;
                    padding: 8px 12px;
                    cursor: pointer;
                    color: #fff;
                    background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
                    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
                    transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
                    font-weight: 700;
                    font-size: 12px;
                    line-height: 1.25;
                }
                .wknm-btn.is-icon {
                    min-width: 36px;
                    padding-left: 10px;
                    padding-right: 10px;
                    justify-content: center;
                    font-size: 14px;
                    line-height: 1;
                }
                .wknm-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 14px 26px rgba(37, 99, 235, 0.24);
                }
                .wknm-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.55;
                    box-shadow: none;
                }
                .wknm-btn.is-ghost {
                    background: rgba(255,255,255,0.86);
                    color: #334155;
                    border: 1px solid rgba(148, 163, 184, 0.38);
                    box-shadow: none;
                }
                .wknm-btn.is-accent {
                    background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
                    box-shadow: 0 12px 24px rgba(14, 165, 233, 0.20);
                }
                .wknm-toolbar {
                    display: grid;
                    grid-template-columns: minmax(220px, 1.5fr) repeat(2, minmax(150px, 0.6fr)) auto 1fr;
                    gap: 10px;
                    align-items: center;
                    padding: 12px 20px;
                    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
                    background: #f9fbff;
                }
                .wknm-input,
                .wknm-select {
                    width: 100%;
                    min-height: 38px;
                    border-radius: 12px;
                    border: 1px solid rgba(148, 163, 184, 0.36);
                    background: rgba(255,255,255,0.92);
                    padding: 8px 11px;
                    color: #1f2937;
                    box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
                    font-size: 12px;
                }
                .wknm-toolbar-right {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 10px;
                    min-width: 0;
                }
                .wknm-status {
                    min-width: 0;
                    text-align: right;
                    font-size: 12px;
                }
                .wknm-status-text {
                    display: inline-block;
                    max-width: 100%;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .wknm-status-text.is-error {
                    color: #b91c1c;
                    font-weight: 700;
                }
                .wknm-status-text.is-accent {
                    color: #0f766e;
                    font-weight: 700;
                }
                .wknm-status-text.is-ok {
                    color: #0f766e;
                }
                .wknm-status-text.is-muted {
                    color: #64748b;
                }
                .wknm-progress {
                    padding: 0 20px 10px;
                }
                .wknm-progress-track {
                    height: 8px;
                    border-radius: 999px;
                    background: rgba(203, 213, 225, 0.6);
                    overflow: hidden;
                }
                .wknm-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #0ea5e9, #14b8a6);
                    width: ${progressPercent()}%;
                    transition: width 0.2s ease;
                }
                .wknm-body {
                    position: relative;
                    flex: 1;
                    min-height: 0;
                    display: grid;
                    grid-template-columns: 236px minmax(340px, 1fr) 312px;
                    overflow: hidden;
                }
                .wknm-body.is-sidebar-collapsed {
                    grid-template-columns: 0 minmax(340px, 1fr) 312px;
                }
                .wknm-sidebar,
                .wknm-main,
                .wknm-detail {
                    min-height: 0;
                    overflow: auto;
                }
                .wknm-sidebar,
                .wknm-table-body,
                .wknm-detail,
                .wknm-guide-body {
                    scrollbar-width: thin;
                    scrollbar-color: var(--wknm-scroll-thumb) var(--wknm-scroll-track);
                    scrollbar-gutter: stable;
                }
                .wknm-sidebar::-webkit-scrollbar,
                .wknm-table-body::-webkit-scrollbar,
                .wknm-detail::-webkit-scrollbar,
                .wknm-guide-body::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }
                .wknm-sidebar::-webkit-scrollbar-track,
                .wknm-table-body::-webkit-scrollbar-track,
                .wknm-detail::-webkit-scrollbar-track,
                .wknm-guide-body::-webkit-scrollbar-track {
                    background: var(--wknm-scroll-track);
                    border-radius: 999px;
                }
                .wknm-sidebar::-webkit-scrollbar-thumb,
                .wknm-table-body::-webkit-scrollbar-thumb,
                .wknm-detail::-webkit-scrollbar-thumb,
                .wknm-guide-body::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #7dd3fc, #38bdf8);
                    border-radius: 999px;
                    border: 2px solid rgba(255, 255, 255, 0.72);
                }
                .wknm-sidebar::-webkit-scrollbar-thumb:hover,
                .wknm-table-body::-webkit-scrollbar-thumb:hover,
                .wknm-detail::-webkit-scrollbar-thumb:hover,
                .wknm-guide-body::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #38bdf8, #0ea5e9);
                }
                .wknm-sidebar {
                    padding: 14px;
                    border-right: 1px solid rgba(226, 232, 240, 0.85);
                    background:
                        linear-gradient(180deg, rgba(239, 246, 255, 0.75), rgba(248, 250, 252, 0.92));
                    min-width: 0;
                    transition: opacity 0.18s ease, padding 0.18s ease, border-color 0.18s ease;
                }
                .wknm-body.is-sidebar-collapsed .wknm-sidebar {
                    height: 0;
                    min-height: 0;
                    border: 0;
                    padding: 0;
                    opacity: 0;
                    pointer-events: none;
                    overflow: hidden;
                }
                .wknm-main {
                    display: flex;
                    flex-direction: column;
                    padding: 14px;
                    overflow: hidden;
                    background: #ffffff;
                }
                .wknm-body.is-sidebar-collapsed .wknm-main {
                    padding-left: 22px;
                }
                .wknm-detail {
                    padding: 14px;
                    border-left: 1px solid rgba(226, 232, 240, 0.85);
                    background:
                        linear-gradient(180deg, rgba(247, 250, 255, 0.96), rgba(255, 255, 255, 0.94));
                }
                .wknm-folder-toggle {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translate(-42%, -50%);
                    z-index: 3;
                    width: 24px;
                    min-height: 76px;
                    border: 1px solid rgba(125, 211, 252, 0.34);
                    border-radius: 0 999px 999px 0;
                    background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(239, 246, 255, 0.96));
                    color: #0284c7;
                    box-shadow: 0 12px 28px rgba(148, 163, 184, 0.16);
                    opacity: 0.14;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
                    overflow: hidden;
                }
                .wknm-folder-toggle::after {
                    content: "";
                    position: absolute;
                    inset: 8px 4px;
                    border-radius: 999px;
                    background: linear-gradient(180deg, rgba(14, 165, 233, 0.08), rgba(59, 130, 246, 0.14));
                }
                .wknm-folder-toggle-icon {
                    position: relative;
                    z-index: 1;
                    font-size: 13px;
                    font-weight: 800;
                    line-height: 1;
                }
                .wknm-body:hover .wknm-folder-toggle,
                .wknm-folder-toggle:focus-visible {
                    opacity: 0.42;
                }
                .wknm-folder-toggle:hover {
                    opacity: 1;
                    transform: translate(-18%, -50%);
                    box-shadow: 0 16px 32px rgba(14, 165, 233, 0.18);
                    border-color: rgba(14, 165, 233, 0.52);
                    animation: wknm-sidehint 1.15s ease-in-out infinite;
                }
                .wknm-section-title {
                    margin-bottom: 10px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #64748b;
                }
                .wknm-folder-card {
                    width: 100%;
                    margin-bottom: 10px;
                    padding: 12px;
                    border-radius: 16px;
                    border: 1px solid rgba(186, 200, 219, 0.45);
                    background: rgba(255,255,255,0.94);
                    cursor: pointer;
                    text-align: left;
                    transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
                    color: #1e293b;
                }
                .wknm-folder-card:hover {
                    transform: translateY(-1px);
                    border-color: rgba(14, 165, 233, 0.42);
                    box-shadow: 0 16px 28px rgba(148, 163, 184, 0.16);
                }
                .wknm-folder-card.is-active {
                    border-color: rgba(14, 165, 233, 0.52);
                    background: linear-gradient(135deg, rgba(224, 242, 254, 0.96), rgba(255, 255, 255, 0.98));
                    box-shadow: 0 18px 34px rgba(14, 165, 233, 0.16);
                }
                .wknm-folder-head {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    align-items: center;
                }
                .wknm-folder-title {
                    font-weight: 700;
                    line-height: 1.35;
                    color: #0f172a;
                }
                .wknm-folder-badge {
                    flex-shrink: 0;
                    padding: 3px 7px;
                    border-radius: 999px;
                    background: rgba(37, 99, 235, 0.10);
                    color: #1d4ed8;
                    font-size: 11px;
                    font-weight: 700;
                }
                .wknm-folder-meta,
                .wknm-folder-submeta {
                    margin-top: 7px;
                    font-size: 11px;
                    color: #64748b;
                }
                .wknm-folder-submeta {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                }
                .wknm-board {
                    border: 1px solid rgba(226, 232, 240, 0.9);
                    border-radius: 18px;
                    overflow: hidden;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-height: 0;
                }
                .wknm-board-head,
                .wknm-table-row {
                    display: grid;
                    grid-template-columns: minmax(280px, 1.9fr) 110px 88px minmax(120px, 1fr) 110px;
                    gap: 12px;
                    align-items: center;
                    padding: 12px 14px;
                }
                .wknm-board-head {
                    background: linear-gradient(180deg, #f8fbff, #eff6ff);
                    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    color: #64748b;
                }
                .wknm-table-body {
                    flex: 1;
                    min-height: 0;
                    overflow: auto;
                }
                .wknm-table-row {
                    width: 100%;
                    border: 0;
                    border-bottom: 1px solid rgba(241, 245, 249, 1);
                    background: #fff;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.16s ease, transform 0.16s ease;
                    color: #1e293b;
                }
                .wknm-table-row:hover {
                    background: #f8fbff;
                }
                .wknm-table-row.is-selected {
                    background: linear-gradient(90deg, rgba(224, 242, 254, 0.74), rgba(239, 246, 255, 0.58));
                }
                .wknm-cell {
                    min-width: 0;
                    font-size: 12px;
                }
                .wknm-cell-name {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 0;
                }
                .wknm-name-cn {
                    font-weight: 800;
                    color: #0f172a;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .wknm-name-vi {
                    color: #475569;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .wknm-cell-num {
                    font-weight: 700;
                    color: #0f766e;
                }
                .wknm-cell-users,
                .wknm-cell-date {
                    color: #64748b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .wknm-status-pill,
                .wknm-metric-pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 28px;
                    padding: 4px 9px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 700;
                }
                .wknm-status-pill.is-active {
                    background: rgba(22, 163, 74, 0.12);
                    color: #15803d;
                }
                .wknm-status-pill.is-deleted {
                    background: rgba(239, 68, 68, 0.12);
                    color: #b91c1c;
                }
                .wknm-status-pill.is-history {
                    background: rgba(245, 158, 11, 0.14);
                    color: #b45309;
                }
                .wknm-metric-pill {
                    background: rgba(37, 99, 235, 0.10);
                    color: #1d4ed8;
                }
                .wknm-detail-title {
                    font-size: 20px;
                    line-height: 1.16;
                    font-weight: 800;
                    color: #10233a;
                }
                .wknm-detail-topbar {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .wknm-detail-topbar .wknm-section-title {
                    margin-bottom: 0;
                }
                .wknm-detail-link {
                    border: 0;
                    background: transparent;
                    color: #0284c7;
                    cursor: pointer;
                    font: inherit;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    padding: 0;
                }
                .wknm-detail-link:hover {
                    text-decoration: underline;
                }
                .wknm-detail-subtitle {
                    margin-top: 7px;
                    font-size: 13px;
                    color: #475569;
                }
                .wknm-detail-block + .wknm-detail-block {
                    margin-top: 16px;
                }
                .wknm-pill-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 12px;
                }
                .wknm-stat-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }
                .wknm-stat-card {
                    padding: 12px;
                    border-radius: 16px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241, 245, 249, 0.96));
                    border: 1px solid rgba(226, 232, 240, 0.95);
                }
                .wknm-stat-card strong {
                    display: block;
                    font-size: 20px;
                    color: #0f172a;
                }
                .wknm-stat-card span {
                    display: block;
                    margin-top: 4px;
                    color: #64748b;
                    font-size: 11px;
                }
                .wknm-chip-list,
                .wknm-variant-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .wknm-chip,
                .wknm-variant {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 7px 10px;
                    border-radius: 999px;
                    background: rgba(241, 245, 249, 0.94);
                    color: #334155;
                    font-size: 11px;
                    font-weight: 700;
                    border: 1px solid rgba(203, 213, 225, 0.8);
                }
                .wknm-chip em {
                    font-style: normal;
                    color: #0f766e;
                }
                .wknm-event-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .wknm-event-card {
                    padding: 12px;
                    border-radius: 16px;
                    border: 1px solid rgba(226, 232, 240, 0.95);
                    background: #fff;
                }
                .wknm-event-card.is-add {
                    background: linear-gradient(180deg, rgba(240, 253, 244, 0.92), rgba(255, 255, 255, 0.98));
                }
                .wknm-event-card.is-delete {
                    background: linear-gradient(180deg, rgba(254, 242, 242, 0.92), rgba(255, 255, 255, 0.98));
                }
                .wknm-event-card.is-update {
                    background: linear-gradient(180deg, rgba(255, 251, 235, 0.92), rgba(255, 255, 255, 0.98));
                }
                .wknm-event-head {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .wknm-event-type {
                    display: inline-flex;
                    align-items: center;
                    padding: 5px 10px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }
                .wknm-event-type.is-add {
                    background: rgba(22, 163, 74, 0.12);
                    color: #15803d;
                }
                .wknm-event-type.is-delete {
                    background: rgba(239, 68, 68, 0.12);
                    color: #b91c1c;
                }
                .wknm-event-type.is-update {
                    background: rgba(245, 158, 11, 0.16);
                    color: #b45309;
                }
                .wknm-event-type.is-other {
                    background: rgba(100, 116, 139, 0.14);
                    color: #475569;
                }
                .wknm-event-date {
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 700;
                }
                .wknm-event-user {
                    margin-bottom: 8px;
                    font-size: 12px;
                    font-weight: 700;
                    color: #0f172a;
                }
                .wknm-event-user a {
                    color: inherit;
                    text-decoration: none;
                }
                .wknm-event-user a:hover {
                    text-decoration: underline;
                }
                .wknm-event-body {
                    display: grid;
                    gap: 8px;
                }
                .wknm-event-pair {
                    border-radius: 14px;
                    padding: 9px 11px;
                    background: rgba(255,255,255,0.86);
                    border: 1px solid rgba(226, 232, 240, 0.9);
                    color: #334155;
                    font-size: 12px;
                }
                .wknm-event-pair label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    color: #64748b;
                }
                .wknm-empty-box,
                .wknm-empty-table {
                    padding: 14px;
                    border-radius: 16px;
                    color: #64748b;
                    background: rgba(248, 250, 252, 0.9);
                    border: 1px dashed rgba(148, 163, 184, 0.45);
                    font-size: 12px;
                    line-height: 1.55;
                }
                .wknm-empty-table {
                    margin: 14px;
                }
                .wknm-help p {
                    margin: 0 0 10px;
                    font-size: 12px;
                    line-height: 1.55;
                    color: #475569;
                }
                .wknm-help p:last-child {
                    margin-bottom: 0;
                }
                .wknm-permission-box {
                    padding: 12px 14px;
                    border-radius: 16px;
                    border: 1px solid rgba(203, 213, 225, 0.9);
                    font-size: 12px;
                    line-height: 1.6;
                    color: #334155;
                    background: rgba(248, 250, 252, 0.94);
                }
                .wknm-permission-box.is-admin {
                    color: #166534;
                    background: rgba(240, 253, 244, 0.96);
                    border-color: rgba(134, 239, 172, 0.72);
                }
                .wknm-permission-box.is-view {
                    color: #92400e;
                    background: rgba(255, 251, 235, 0.96);
                    border-color: rgba(253, 230, 138, 0.72);
                }
                .wknm-editor-card {
                    display: grid;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 18px;
                    border: 1px solid rgba(226, 232, 240, 0.95);
                    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248, 250, 252, 0.98));
                }
                .wknm-editor-grid,
                .wknm-meta-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }
                .wknm-meta-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
                .wknm-field {
                    display: grid;
                    gap: 6px;
                    min-width: 0;
                }
                .wknm-field-label {
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    color: #64748b;
                }
                .wknm-textarea {
                    width: 100%;
                    min-height: 112px;
                    resize: vertical;
                    border-radius: 14px;
                    border: 1px solid rgba(148, 163, 184, 0.36);
                    background: rgba(255,255,255,0.94);
                    padding: 10px 11px;
                    color: #1f2937;
                    font: inherit;
                    font-size: 12px;
                    line-height: 1.55;
                }
                .wknm-editor-actions,
                .wknm-link-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .wknm-meta-card {
                    min-width: 0;
                    padding: 10px 11px;
                    border-radius: 14px;
                    background: rgba(239, 246, 255, 0.68);
                    border: 1px solid rgba(191, 219, 254, 0.8);
                }
                .wknm-meta-card strong {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: #64748b;
                }
                .wknm-meta-card span {
                    display: block;
                    font-size: 12px;
                    color: #0f172a;
                    word-break: break-word;
                }
                .wknm-suggestion-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .wknm-suggestion-item,
                .wknm-link-chip {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 32px;
                    padding: 7px 11px;
                    border-radius: 999px;
                    border: 1px solid rgba(125, 211, 252, 0.7);
                    background: rgba(224, 242, 254, 0.74);
                    color: #0369a1;
                    font: inherit;
                    font-size: 12px;
                    font-weight: 700;
                    text-decoration: none;
                    cursor: pointer;
                }
                .wknm-suggestion-item:hover,
                .wknm-link-chip:hover {
                    background: rgba(186, 230, 253, 0.94);
                }
                .wknm-btn.is-danger {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 12px 24px rgba(220, 38, 38, 0.18);
                }
                .wknm-confirm {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483003;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 18px;
                }
                .wknm-confirm.is-open {
                    display: flex;
                }
                .wknm-confirm-backdrop {
                    position: absolute;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.56);
                    backdrop-filter: blur(5px);
                }
                .wknm-confirm-card {
                    position: relative;
                    width: min(430px, 100%);
                    padding: 18px;
                    border-radius: 22px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,250,252,0.99));
                    border: 1px solid rgba(148, 163, 184, 0.24);
                    box-shadow: 0 32px 70px rgba(15, 23, 42, 0.28);
                }
                .wknm-confirm-kicker {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #b45309;
                }
                .wknm-confirm-title {
                    margin: 8px 0 0;
                    font-size: 20px;
                    color: #10233a;
                }
                .wknm-confirm-body {
                    margin-top: 14px;
                    color: #475569;
                    font-size: 12px;
                    line-height: 1.62;
                }
                .wknm-confirm-body p {
                    margin: 0 0 8px;
                }
                .wknm-confirm-body p:last-child {
                    margin-bottom: 0;
                }
                .wknm-confirm-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    margin-top: 16px;
                    flex-wrap: wrap;
                }
                .wknm-guide {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483002;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 18px;
                }
                .wknm-guide.is-open {
                    display: flex;
                }
                .wknm-guide-backdrop {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(circle at top left, rgba(56, 189, 248, 0.24), transparent 35%),
                        rgba(15, 23, 42, 0.58);
                    backdrop-filter: blur(6px);
                }
                .wknm-guide-card {
                    position: relative;
                    width: min(720px, 100%);
                    max-height: min(84vh, 860px);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border-radius: 24px;
                    border: 1px solid rgba(148, 163, 184, 0.24);
                    background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(247,250,255,0.98));
                    box-shadow: 0 32px 70px rgba(15, 23, 42, 0.30);
                }
                .wknm-guide-head {
                    padding: 18px 20px 14px;
                    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
                    background:
                        radial-gradient(circle at top right, rgba(125, 211, 252, 0.22), transparent 36%),
                        linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(255, 255, 255, 0.98));
                }
                .wknm-guide-kicker {
                    color: #0f766e;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }
                .wknm-guide-title {
                    margin: 6px 0 0;
                    font-size: 22px;
                    line-height: 1.18;
                    color: #10233a;
                }
                .wknm-guide-meta {
                    margin-top: 8px;
                }
                .wknm-guide-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 8px;
                    border-radius: 999px;
                    background: rgba(14, 165, 233, 0.10);
                    color: #0369a1;
                    font-size: 11px;
                    font-weight: 700;
                }
                .wknm-guide-body {
                    padding: 18px 20px;
                    overflow: auto;
                }
                .wknm-guide-section + .wknm-guide-section {
                    margin-top: 18px;
                }
                .wknm-guide-section h3 {
                    margin: 0 0 10px;
                    font-size: 15px;
                    color: #10233a;
                }
                .wknm-guide-section p {
                    margin: 0;
                    color: #475569;
                    font-size: 13px;
                    line-height: 1.62;
                }
                .wknm-guide-list {
                    margin: 0;
                    padding-left: 18px;
                    color: #334155;
                    font-size: 13px;
                    line-height: 1.62;
                }
                .wknm-guide-list li + li {
                    margin-top: 8px;
                }
                .wknm-guide-note {
                    margin-top: 18px;
                    padding: 12px 14px;
                    border-radius: 16px;
                    background: rgba(224, 242, 254, 0.56);
                    border: 1px solid rgba(125, 211, 252, 0.44);
                    color: #0f172a;
                    font-size: 12px;
                    line-height: 1.58;
                }
                .wknm-guide-actions {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 14px 20px 18px;
                    border-top: 1px solid rgba(226, 232, 240, 0.9);
                    background: rgba(248, 250, 252, 0.84);
                }
                @keyframes wknm-pulse {
                    0% { transform: scale(1); opacity: 0.55; }
                    50% { transform: scale(1.04); opacity: 0.95; }
                    100% { transform: scale(1); opacity: 0.55; }
                }
                @keyframes wknm-sidehint {
                    0%, 100% { transform: translate(-18%, -50%); }
                    50% { transform: translate(-6%, -50%); }
                }
                @media (max-width: 1280px) {
                    .wknm-dialog {
                        inset: 12px;
                    }
                    .wknm-body {
                        grid-template-columns: 224px minmax(320px, 1fr) 290px;
                    }
                    .wknm-board-head,
                    .wknm-table-row {
                        grid-template-columns: minmax(220px, 1.6fr) 100px 72px minmax(100px, 1fr) 96px;
                    }
                }
                @media (max-width: 1024px) {
                    .wknm-fab {
                        right: 14px;
                        bottom: 14px;
                        padding: 10px 12px;
                    }
                    .wknm-dialog {
                        inset: 10px;
                        border-radius: 22px;
                    }
                    .wknm-header {
                        flex-direction: column;
                    }
                    .wknm-toolbar {
                        grid-template-columns: 1fr 1fr;
                    }
                    .wknm-toolbar-right {
                        grid-column: 1 / -1;
                        justify-content: space-between;
                    }
                    .wknm-body {
                        grid-template-columns: 1fr;
                    }
                    .wknm-body.is-sidebar-collapsed {
                        grid-template-columns: 1fr;
                    }
                    .wknm-sidebar,
                    .wknm-main,
                    .wknm-detail {
                        border: 0;
                    }
                    .wknm-sidebar {
                        border-bottom: 1px solid rgba(226, 232, 240, 0.9);
                    }
                    .wknm-main {
                        border-bottom: 1px solid rgba(226, 232, 240, 0.9);
                    }
                    .wknm-folder-toggle {
                        top: 14px;
                        transform: translate(-18%, 0);
                        min-height: 44px;
                    }
                    .wknm-folder-toggle:hover {
                        transform: translate(-2%, 0);
                    }
                    .wknm-board-head,
                    .wknm-table-row {
                        grid-template-columns: minmax(220px, 1.6fr) 96px 70px;
                    }
                    .wknm-board-head .wknm-col-users,
                    .wknm-board-head .wknm-col-date,
                    .wknm-table-row .wknm-cell-users,
                    .wknm-table-row .wknm-cell-date {
                        display: none;
                    }
                    .wknm-guide {
                        padding: 12px;
                    }
                    .wknm-guide-card {
                        width: min(100%, 760px);
                    }
                    .wknm-meta-grid {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 720px) {
                    .wknm-fab-label {
                        display: none;
                    }
                    .wknm-dialog {
                        inset: 0;
                        border-radius: 0;
                    }
                    .wknm-header,
                    .wknm-toolbar,
                    .wknm-progress,
                    .wknm-sidebar,
                    .wknm-main,
                    .wknm-detail {
                        padding-left: 14px;
                        padding-right: 14px;
                    }
                    .wknm-title {
                        font-size: 18px;
                    }
                    .wknm-toolbar {
                        grid-template-columns: 1fr;
                    }
                    .wknm-folder-toggle {
                        left: 2px;
                    }
                    .wknm-toolbar-right {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .wknm-board-head,
                    .wknm-table-row {
                        grid-template-columns: minmax(180px, 1fr) 86px 62px;
                        gap: 8px;
                        padding: 12px 14px;
                    }
                    .wknm-board-head .wknm-col-revisions {
                        text-align: center;
                    }
                    .wknm-board-head .wknm-col-name {
                        padding-right: 10px;
                    }
                    .wknm-stat-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                    .wknm-editor-grid,
                    .wknm-meta-grid {
                        grid-template-columns: 1fr;
                    }
                    .wknm-guide {
                        padding: 0;
                    }
                    .wknm-guide-card {
                        width: 100%;
                        max-height: 100vh;
                        height: 100%;
                        border-radius: 0;
                    }
                    .wknm-guide-actions {
                        padding-bottom: 14px;
                    }
                    .wknm-confirm {
                        padding: 10px;
                    }
                    .wknm-confirm-card {
                        border-radius: 18px;
                    }
                }
            </style>
            <div class="wknm-root">
                <button type="button" class="wknm-fab" data-action="toggle-panel" title="Mở ${escapeAttr(APP_NAME)}. Kéo để di chuyển." ${getFabInlineStyle()}>
                    <span class="wknm-fab-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                            <path d="M10.5 4.5a6 6 0 1 0 3.73 10.7l4.78 4.78 1.42-1.42-4.78-4.78A6 6 0 0 0 10.5 4.5Z" stroke="rgba(255,255,255,0.95)" stroke-width="1.7"/>
                            <path d="M9.5 7.3h2.1M10.55 6.25v2.1M14.9 7.65h1.6M15.7 6.85v1.6" stroke="rgba(255,255,255,0.9)" stroke-width="1.4" stroke-linecap="round"/>
                        </svg>
                    </span>
                    <span class="wknm-fab-label">Name Desk</span>
                </button>
                <div class="wknm-overlay${state.panelOpen ? ' is-open' : ''}">
                    <div class="wknm-backdrop" data-action="close-panel"></div>
                    <div class="wknm-dialog" role="dialog" aria-modal="true" aria-label="${escapeAttr(APP_NAME)}">
                        <div class="wknm-header">
                            <div class="wknm-title-wrap">
                                <div class="wknm-kicker">Name Workspace</div>
                                <h2 class="wknm-title">${escapeHtml(state.book.title || 'Đang nhận diện truyện...')}</h2>
                                <div class="wknm-subtitle">
                                    <span>bookId <code>${escapeHtml(state.book.id || 'chưa có')}</code></span>
                                    <span>${escapeHtml(selectedFolder ? `Folder: ${selectedFolder.label}` : 'Chưa chọn folder')}</span>
                                    <span>${escapeHtml(selectedFolder ? selectedFolder.id : '')}</span>
                                    ${namesRecord ? `<span>${escapeHtml(namesRecord.isAdmin ? 'Có quyền sửa name' : 'Chỉ có quyền xem')}</span>` : ''}
                                </div>
                            </div>
                            <div class="wknm-header-actions">
                                <button type="button" class="wknm-btn is-ghost is-icon" data-action="open-help" title="Hướng dẫn">?</button>
                                <button type="button" class="wknm-btn is-ghost" data-action="refresh-folders" ${isBusy ? 'disabled' : ''}>Tải lại</button>
                                ${namesRecord && namesRecord.isAdmin ? `<button type="button" class="wknm-btn is-ghost" data-action="show-add-panel">+ Name</button>` : ''}
                                <button type="button" class="wknm-btn is-accent" data-action="scan-history" ${(!selectedFolder || state.isBooting || state.isLoadingFolders || state.isLoadingNames || state.isScanningHistory) ? 'disabled' : ''}>Quét lịch sử</button>
                                <button type="button" class="wknm-btn is-ghost" data-action="copy-folder" ${namesDisabled ? 'disabled' : ''}>Copy</button>
                                <button type="button" class="wknm-btn is-ghost" data-action="download-names" ${namesDisabled ? 'disabled' : ''}>Tải TXT</button>
                                <button type="button" class="wknm-btn is-ghost" data-action="export-csv" ${statsDisabled ? 'disabled' : ''}>Tải CSV</button>
                                <button type="button" class="wknm-btn is-ghost" data-action="export-json" ${statsDisabled ? 'disabled' : ''}>Tải JSON</button>
                                <button type="button" class="wknm-btn is-ghost" data-action="close-panel">Đóng</button>
                            </div>
                        </div>
                        <div class="wknm-toolbar">
                            <input class="wknm-input" type="search" data-input="search" value="${escapeAttr(state.search)}" placeholder="Tìm theo name CN/VI hoặc user..." />
                            <select class="wknm-select" data-select="statusFilter">
                                <option value="all"${state.statusFilter === 'all' ? ' selected' : ''}>Tất cả trạng thái</option>
                                <option value="active"${state.statusFilter === 'active' ? ' selected' : ''}>Đang có</option>
                                <option value="deleted"${state.statusFilter === 'deleted' ? ' selected' : ''}>Đã xóa</option>
                                <option value="history"${state.statusFilter === 'history' ? ' selected' : ''}>Chỉ lịch sử</option>
                            </select>
                            <select class="wknm-select" data-select="sortBy">
                                <option value="latest"${state.sortBy === 'latest' ? ' selected' : ''}>Ưu tiên mới nhất</option>
                                <option value="revisions"${state.sortBy === 'revisions' ? ' selected' : ''}>Nhiều thay đổi nhất</option>
                                <option value="contributors"${state.sortBy === 'contributors' ? ' selected' : ''}>Nhiều user nhất</option>
                                <option value="az"${state.sortBy === 'az' ? ' selected' : ''}>A-Z</option>
                            </select>
                            <button type="button" class="wknm-btn is-ghost" data-action="refresh-folder" ${(!selectedFolder || isBusy) ? 'disabled' : ''}>Làm mới folder</button>
                            <div class="wknm-toolbar-right">
                                <div class="wknm-status">${renderStatusText()}</div>
                            </div>
                        </div>
                        ${state.isScanningHistory ? `
                            <div class="wknm-progress">
                                <div class="wknm-progress-track">
                                    <div class="wknm-progress-bar"></div>
                                </div>
                            </div>
                        ` : ''}
                        <div class="wknm-body${state.sidebarCollapsed ? ' is-sidebar-collapsed' : ''}">
                            <button type="button" class="wknm-folder-toggle" data-action="toggle-sidebar" title="${escapeAttr(state.sidebarCollapsed ? 'Mở danh sách folder' : 'Ẩn danh sách folder')}" aria-label="${escapeAttr(state.sidebarCollapsed ? 'Mở danh sách folder' : 'Ẩn danh sách folder')}">
                                <span class="wknm-folder-toggle-icon">${state.sidebarCollapsed ? '&#9656;' : '&#9666;'}</span>
                            </button>
                            <aside class="wknm-sidebar">
                                <div class="wknm-section-title">Folder</div>
                                ${renderFolderCards()}
                            </aside>
                            <main class="wknm-main">
                                <div class="wknm-board">
                                    <div class="wknm-board-head">
                                        <div class="wknm-col-name">Name</div>
                                        <div>Trạng thái</div>
                                        <div class="wknm-col-revisions">Sự kiện</div>
                                        <div class="wknm-col-users">User</div>
                                        <div class="wknm-col-date">Mới nhất</div>
                                    </div>
                                    <div class="wknm-table-body">
                                        ${renderTableRows(rows)}
                                    </div>
                                </div>
                            </main>
                            <aside class="wknm-detail">
                                ${selectedRow ? renderDetailPanel(selectedRow) : renderSummaryPanel(selectedFolder, currentRows)}
                            </aside>
                        </div>
                    </div>
                </div>
                ${renderGuideModal()}
                ${renderDeleteConfirmModal()}
            </div>
        `;
        restoreRenderState(viewState);
        requestAnimationFrame(() => {
            syncFabButtonToViewport(false);
        });
    }

    async function ensureInitialized(force) {
        if (state.isBooting) {
            return;
        }

        state.isBooting = true;
        clearError();
        state.book = detectBookMeta();
        setInfo('Đang khởi tạo name desk...');
        render();

        try {
            if (!state.book.id) {
                throw new Error('Không tìm thấy bookId trên trang này. Hãy mở trang truyện hoặc chương thuộc wikicv.net.');
            }

            await fetchFolders(!!force);
            if (state.selectedFolderId) {
                await fetchNames(state.selectedFolderId, !!force);
            }
            state.initialized = true;
            syncSelectedNameKey();
            setInfo('Sẵn sàng.');
        } catch (error) {
            setError(error);
        } finally {
            state.isBooting = false;
            syncSelectedNameKey();
            render();
        }
    }

    async function selectFolder(folderId) {
        if (!folderId || folderId === state.selectedFolderId) {
            return;
        }
        state.selectedFolderId = folderId;
        state.selectedNameKey = '';
        resetEditorForFolder(folderId);
        closeDeleteConfirm();
        render();
        try {
            await fetchNames(folderId, false);
        } catch (error) {
            setError(error);
            render();
        }
    }

    async function refreshCurrentFolder() {
        if (!state.selectedFolderId) {
            return;
        }
        try {
            await fetchNames(state.selectedFolderId, true);
            const folder = getSelectedFolder();
            if (folder && state.historyCache.has(folder.id)) {
                const historyRecord = state.historyCache.get(folder.id);
                state.historyCache.set(folder.id, buildHistoryRecord(folder, state.namesCache.get(folder.id), historyRecord.events, historyRecord.scannedAt));
            }
            setInfo(`Đã làm mới folder ${state.selectedFolderId}.`);
        } catch (error) {
            setError(error);
        } finally {
            syncSelectedNameKey();
            render();
        }
    }

    async function copyCurrentFolder() {
        if (!state.selectedFolderId) {
            return;
        }
        try {
            const namesRecord = state.namesCache.get(state.selectedFolderId) || await fetchNames(state.selectedFolderId, false);
            const text = namesRecord.names.map((item) => `${item.cn}=${item.vi}`).join('\n');
            if (!text) {
                throw new Error('Folder hiện tại không có name để copy.');
            }
            await copyText(text);
            setInfo(`Đã copy ${namesRecord.names.length} name của folder ${state.selectedFolderId}.`);
        } catch (error) {
            setError(error);
        } finally {
            render();
        }
    }

    async function downloadCurrentFolderNames() {
        if (!state.selectedFolderId) {
            return;
        }
        try {
            const namesRecord = state.namesCache.get(state.selectedFolderId) || await fetchNames(state.selectedFolderId, false);
            const text = namesRecord.names.map((item) => `${item.cn}=${item.vi}`).join('\n');
            if (!text) {
                throw new Error('Folder hiện tại không có name để tải.');
            }
            const filename = `${sanitizeFilename(state.book.title || state.book.id)}__${sanitizeFilename(state.selectedFolderId)}__names.txt`;
            downloadText(filename, text, 'text/plain;charset=utf-8');
            setInfo(`Đang tải file name của folder ${state.selectedFolderId}.`);
        } catch (error) {
            setError(error);
        } finally {
            render();
        }
    }

    async function exportCurrentCsv() {
        const folder = getSelectedFolder();
        if (!folder) {
            return;
        }
        try {
            const rows = getRowsForFolder(folder.id);
            if (!rows.length) {
                throw new Error('Folder hiện tại chưa có dữ liệu để xuất.');
            }
            const csv = buildStatsCsv(folder, rows);
            const filename = `${sanitizeFilename(state.book.title || state.book.id)}__${sanitizeFilename(folder.id)}__stats.csv`;
            downloadText(filename, csv, 'text/csv;charset=utf-8');
            setInfo(`Đang tải CSV thống kê của folder ${folder.label}.`);
        } catch (error) {
            setError(error);
        } finally {
            render();
        }
    }

    async function exportCurrentJson() {
        const folder = getSelectedFolder();
        if (!folder) {
            return;
        }
        try {
            const rows = getRowsForFolder(folder.id);
            if (!rows.length) {
                throw new Error('Folder hiện tại chưa có dữ liệu để xuất.');
            }
            const json = exportStatsJson(folder, rows);
            const filename = `${sanitizeFilename(state.book.title || state.book.id)}__${sanitizeFilename(folder.id)}__stats.json`;
            downloadText(filename, json, 'application/json;charset=utf-8');
            setInfo(`Đang tải JSON thống kê của folder ${folder.label}.`);
        } catch (error) {
            setError(error);
        } finally {
            render();
        }
    }

    function getSelectedNamesRecord() {
        if (!state.selectedFolderId) {
            return null;
        }
        return state.namesCache.get(state.selectedFolderId) || null;
    }

    function hasSelectedFolderAdmin() {
        const record = getSelectedNamesRecord();
        return !!(record && record.isAdmin);
    }

    function resetEditorForFolder(folderId) {
        state.editor.folderId = folderId || '';
        state.editor.targetKey = '';
        state.editor.nameCn = '';
        state.editor.nameVi = '';
        state.editor.nameCv = '';
        state.editor.namePy = '';
        state.editor.exists = false;
        state.editor.checking = false;
        state.editor.saving = false;
        state.editor.suggestions = [];
        state.editor.googleSearch = '';
        state.editor.googleTranslate = '';
        state.editor.addCn = '';
        state.editor.addVi = '';
        state.editor.bulkText = '';
    }

    function syncEditorState(selectedFolder, selectedRow) {
        const folderId = selectedFolder ? selectedFolder.id : '';
        if (state.editor.folderId !== folderId) {
            resetEditorForFolder(folderId);
        }

        if (!selectedRow) {
            state.editor.targetKey = '';
            state.editor.nameCn = '';
            state.editor.nameVi = '';
            state.editor.nameCv = '';
            state.editor.namePy = '';
            state.editor.exists = false;
            state.editor.suggestions = [];
            state.editor.googleSearch = '';
            state.editor.googleTranslate = '';
            return;
        }

        if (state.editor.targetKey === selectedRow.key) {
            return;
        }

        state.editor.targetKey = selectedRow.key;
        state.editor.nameCn = selectedRow.nameCn || '';
        state.editor.nameVi = selectedRow.currentVi || selectedRow.displayVi || selectedRow.lastKnownVi || '';
        state.editor.nameCv = '';
        state.editor.namePy = '';
        state.editor.exists = false;
        state.editor.checking = false;
        state.editor.saving = false;
        state.editor.suggestions = [];
        state.editor.googleSearch = '';
        state.editor.googleTranslate = '';
    }

    function parseSuggestedNames(html) {
        if (!html) {
            return [];
        }
        const doc = parseHtml(html);
        const values = Array.from(doc.querySelectorAll('li[data-action="selectSuggestedName"]'))
            .map((node) => normalizeSpace(node.textContent || ''))
            .filter(Boolean);
        return Array.from(new Set(values));
    }

    function parseBulkPairs(text) {
        const entries = [];
        const lines = String(text || '').split(/\r?\n/);
        lines.forEach((rawLine, index) => {
            const line = rawLine.trim();
            if (!line) {
                return;
            }
            const separator = line.includes('=') ? '=' : '\t';
            const pair = splitOnce(line, separator);
            const cn = normalizeSpace(pair[0]);
            const vi = normalizeSpace(pair[1]);
            if (!cn || !vi) {
                throw new Error(`Dòng ${index + 1} không đúng định dạng CN=VI.`);
            }
            entries.push({ cn: cn, vi: vi });
        });
        if (!entries.length) {
            throw new Error('Chưa có dòng name hợp lệ để thêm.');
        }
        return entries;
    }

    async function requestNameCheck(row, nameViOverride) {
        const payload = await requestJson('/name/check', {
            bookId: state.book.id,
            nameCn: state.editor.nameCn || row.nameCn,
            nameVi: nameViOverride != null ? nameViOverride : (state.editor.nameVi || row.displayVi || ''),
            chapterId: '',
            chapterPart: 0,
            listType: row.listType || 1,
        }, {
            folderIds: [state.selectedFolderId],
            useEditCookie: true,
            headers: {
                Accept: 'application/json, text/javascript, */*; q=0.01',
            },
        });
        if (!payload || payload.err !== 0 || !payload.data) {
            throw new Error('Không lấy được gợi ý name.');
        }
        return payload.data;
    }

    function cloneNameItem(item) {
        return {
            ...item,
        };
    }

    function normalizeListType(value, fallback) {
        const primary = normalizeSpace(value);
        if (/^\d+$/.test(primary)) {
            return primary;
        }
        const backup = normalizeSpace(fallback);
        if (/^\d+$/.test(backup)) {
            return backup;
        }
        return '1';
    }

    function createLiveNameEntry(cn, vi, listType, editable) {
        const normalizedCn = normalizeSpace(cn);
        const normalizedVi = normalizeSpace(vi);
        const normalizedListType = normalizeListType(listType, '1');
        return {
            index: 0,
            cn: normalizedCn,
            vi: normalizedVi,
            lt: normalizedListType,
            listType: normalizedListType,
            editable: editable !== false,
            text: `${normalizedCn}=${normalizedVi}`,
        };
    }

    function finalizeNamesRecord(record) {
        const sortedNames = (record && record.names ? record.names : [])
            .map((item) => cloneNameItem(item))
            .filter((item) => normalizeSpace(item.cn) || normalizeSpace(item.vi))
            .map((item) => {
                const cn = normalizeSpace(item.cn);
                const vi = normalizeSpace(item.vi);
                const listType = normalizeListType(item.listType || item.lt, '1');
                return {
                    ...item,
                    cn: cn,
                    vi: vi,
                    lt: listType,
                    listType: listType,
                    editable: item.editable !== false,
                    text: normalizeSpace(item.text || `${cn}=${vi}`),
                };
            })
            .sort((a, b) => compareText(a.cn, b.cn) || compareText(a.vi, b.vi))
            .map((item, index) => ({
                ...item,
                index: index,
            }));

        return {
            ...record,
            loadedAt: Date.now(),
            total: sortedNames.length,
            names: sortedNames,
        };
    }

    function commitNamesRecord(folderId, record) {
        const finalized = finalizeNamesRecord({
            ...record,
            folderId: folderId,
        });
        state.namesCache.set(folderId, finalized);
        const folder = state.folders.find((item) => item.id === folderId);
        if (folder) {
            folder.count = finalized.total;
        }
        const historyRecord = state.historyCache.get(folderId);
        if (historyRecord && folder) {
            state.historyCache.set(folderId, buildHistoryRecord(folder, finalized, historyRecord.events, historyRecord.scannedAt));
        }
        return finalized;
    }

    function mutateNamesRecord(folderId, updater) {
        const current = state.namesCache.get(folderId) || {
            folderId: folderId,
            loadedAt: Date.now(),
            total: 0,
            names: [],
            isAdmin: hasSelectedFolderAdmin(),
            footerHtml: '',
        };
        const draft = {
            ...current,
            names: (current.names || []).map((item) => cloneNameItem(item)),
        };
        updater(draft);
        return commitNamesRecord(folderId, draft);
    }

    function createLocalHistoryEvent(type, config) {
        const before = config && config.before ? { cn: normalizeSpace(config.before.cn), vi: normalizeSpace(config.before.vi) } : null;
        const after = config && config.after ? { cn: normalizeSpace(config.after.cn), vi: normalizeSpace(config.after.vi) } : null;
        const now = new Date();
        let message = '';
        if (type === 'add') {
            message = `đã thêm name ${formatNamePair(after)}`;
        } else if (type === 'delete') {
            message = `đã xóa name ${formatNamePair(before)}`;
        } else {
            message = `đã sửa name ${formatNamePair(after || before)}`;
        }
        return {
            key: `local-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
            pageStart: -1,
            order: -now.getTime(),
            dateText: formatDateText(now),
            timestamp: now.getTime(),
            actor: 'Bạn',
            actorPath: '',
            actorUrl: '',
            message: message,
            rawText: `${message} (local)`,
            type: type === 'edit' ? 'update' : type,
            before: before,
            after: after,
            nameCn: (after && after.cn) || (before && before.cn) || '',
            nameVi: (after && after.vi) || (before && before.vi) || '',
            relatedKeys: Array.from(new Set([
                before && before.cn,
                after && after.cn,
            ].filter(Boolean))),
            isLocal: true,
        };
    }

    function prependHistoryEvents(folderId, events) {
        if (!events || !events.length) {
            return;
        }
        const folder = state.folders.find((item) => item.id === folderId);
        const namesRecord = state.namesCache.get(folderId);
        const historyRecord = state.historyCache.get(folderId);
        if (!folder || !namesRecord || !historyRecord) {
            return;
        }
        const nextEvents = events.concat(historyRecord.events);
        state.historyCache.set(folderId, buildHistoryRecord(folder, namesRecord, nextEvents, Date.now()));
    }

    async function refreshFolderAfterMutation(folderId, mutation, message) {
        if (mutation && mutation.type) {
            mutateNamesRecord(folderId, (draft) => {
                if (mutation.type === 'add') {
                    (mutation.entries || []).forEach((entry) => {
                        const nextEntry = createLiveNameEntry(entry.cn, entry.vi, entry.listType || '1', true);
                        const index = draft.names.findIndex((item) => normalizeSpace(item.cn) === nextEntry.cn);
                        if (index >= 0) {
                            draft.names[index] = {
                                ...draft.names[index],
                                ...nextEntry,
                            };
                        } else {
                            draft.names.push(nextEntry);
                        }
                    });
                    return;
                }

                if (mutation.type === 'edit') {
                    const nextEntry = createLiveNameEntry(mutation.nameCn, mutation.nameVi, mutation.listType || '1', true);
                    const index = draft.names.findIndex((item) => normalizeSpace(item.cn) === nextEntry.cn);
                    if (index >= 0) {
                        draft.names[index] = {
                            ...draft.names[index],
                            ...nextEntry,
                        };
                    } else {
                        draft.names.push(nextEntry);
                    }
                    return;
                }

                if (mutation.type === 'delete') {
                    draft.names = draft.names.filter((item) => normalizeSpace(item.cn) !== normalizeSpace(mutation.nameCn));
                }
            });
            prependHistoryEvents(folderId, mutation.localEvents || []);
            if (Object.prototype.hasOwnProperty.call(mutation, 'selectedNameKey')) {
                state.selectedNameKey = mutation.selectedNameKey || '';
            }
        }
        state.editor.targetKey = '';
        state.editor.nameCn = '';
        state.editor.nameVi = '';
        state.editor.nameCv = '';
        state.editor.namePy = '';
        state.editor.exists = false;
        state.editor.checking = false;
        state.editor.saving = false;
        state.editor.suggestions = [];
        state.editor.googleSearch = '';
        state.editor.googleTranslate = '';
        if (state.selectedFolderId === folderId) {
            syncSelectedNameKey();
        }
        setInfo(message || 'Đã cập nhật dữ liệu hiện tại.');
    }

    async function addNames(entries) {
        if (!state.selectedFolderId) {
            throw new Error('Chưa chọn folder để thêm name.');
        }
        if (!hasSelectedFolderAdmin()) {
            throw new Error('Bạn không có quyền thêm/sửa/xóa name ở folder này.');
        }
        const normalizedEntries = (entries || []).map((item) => ({
            cn: normalizeSpace(item && item.cn),
            vi: normalizeSpace(item && item.vi),
        })).filter((item) => item.cn || item.vi);
        if (!normalizedEntries.length || normalizedEntries.some((item) => !item.cn || !item.vi)) {
            throw new Error('Name CN và Name VI đều bắt buộc khi thêm name.');
        }
        const pairs = [
            ['submit', 'add'],
            ['bookId', state.book.id],
        ];
        normalizedEntries.forEach((item) => {
            pairs.push(['nameCn', item.cn]);
            pairs.push(['nameVi', item.vi]);
        });
        const payload = await requestFormJson('/name', pairs, {
            folderIds: [state.selectedFolderId],
            useEditCookie: true,
        });
        if (!payload || payload.err !== 0) {
            throw new Error('Thêm name thất bại.');
        }
        await refreshFolderAfterMutation(state.selectedFolderId, {
            type: 'add',
            entries: normalizedEntries,
            localEvents: normalizedEntries.map((item) => createLocalHistoryEvent('add', {
                after: {
                    cn: item.cn,
                    vi: item.vi,
                },
            })),
            selectedNameKey: normalizedEntries.length === 1 ? normalizedEntries[0].cn : state.selectedNameKey,
        }, `Đã thêm ${normalizedEntries.length} name.`);
        state.editor.addCn = '';
        state.editor.addVi = '';
        state.editor.bulkText = '';
    }

    async function checkSelectedNameSuggestion() {
        const row = getSelectedRow();
        if (!row) {
            return;
        }
        if (!hasSelectedFolderAdmin()) {
            throw new Error('Bạn không có quyền sửa name ở folder này.');
        }
        if (!row.canEdit || row.status !== 'active') {
            throw new Error('Name hiện tại không thể sửa trực tiếp.');
        }
        state.editor.checking = true;
        clearError();
        render();
        try {
            const data = await requestNameCheck(row);
            state.editor.nameCv = normalizeSpace(data.name_cv || '');
            state.editor.namePy = normalizeSpace(data.name_py || '');
            state.editor.exists = !!data.exists;
            state.editor.googleSearch = normalizeSpace(data.google_search || '');
            state.editor.googleTranslate = normalizeSpace(data.google_translate || '');
            state.editor.suggestions = parseSuggestedNames(data.suggest_name || '');
            if (!state.editor.nameVi && data.name_vi) {
                state.editor.nameVi = normalizeSpace(data.name_vi);
            }
            setInfo(`Đã lấy gợi ý cho ${row.nameCn}.`);
        } finally {
            state.editor.checking = false;
            render();
        }
    }

    async function saveSelectedNameEdit() {
        const row = getSelectedRow();
        if (!row) {
            return;
        }
        if (!hasSelectedFolderAdmin()) {
            throw new Error('Bạn không có quyền sửa name ở folder này.');
        }
        const nameVi = normalizeSpace(state.editor.nameVi);
        if (!nameVi) {
            throw new Error('Name Việt không được để trống khi lưu sửa.');
        }
        state.editor.saving = true;
        clearError();
        render();
        try {
            const currentName = row.currentNames && row.currentNames.length ? row.currentNames[0] : null;
            const originalVi = currentName && currentName.vi ? currentName.vi : (row.displayVi || row.currentVi || '');
            if (!state.editor.nameCv && !state.editor.namePy) {
                const data = await requestNameCheck(row);
                state.editor.nameCv = normalizeSpace(data.name_cv || '');
                state.editor.namePy = normalizeSpace(data.name_py || '');
            }
            const payload = await requestFormJson('/name', [
                ['bookId', state.book.id],
                ['nameCn', row.nameCn],
                ['nameCv', state.editor.nameCv || ''],
                ['namePy', state.editor.namePy || ''],
                ['nameVi', nameVi],
                ['submit', 'edit'],
                ['listType', row.listType || 1],
            ], {
                folderIds: [state.selectedFolderId],
                useEditCookie: true,
            });
            if (!payload || payload.err !== 0) {
                throw new Error('Lưu sửa name thất bại.');
            }
            await refreshFolderAfterMutation(state.selectedFolderId, {
                type: 'edit',
                nameCn: row.nameCn,
                nameVi: nameVi,
                listType: row.listType || '1',
                localEvents: [createLocalHistoryEvent('edit', {
                    before: {
                        cn: row.nameCn,
                        vi: originalVi,
                    },
                    after: {
                        cn: row.nameCn,
                        vi: nameVi,
                    },
                })],
                selectedNameKey: row.key,
            }, `Đã sửa name ${row.nameCn}.`);
        } finally {
            state.editor.saving = false;
            render();
        }
    }

    function openDeleteConfirm(row) {
        state.deleteConfirm = {
            open: true,
            deleting: false,
            rowKey: row.key,
            nameCn: row.nameCn,
            nameVi: row.displayVi || row.currentVi || '',
        };
        render();
    }

    function closeDeleteConfirm() {
        if (!state.deleteConfirm.open) {
            return;
        }
        state.deleteConfirm.open = false;
        state.deleteConfirm.deleting = false;
        render();
    }

    async function deleteSelectedName() {
        const row = getSelectedRow();
        if (!row) {
            return;
        }
        if (!hasSelectedFolderAdmin()) {
            throw new Error('Bạn không có quyền xóa name ở folder này.');
        }
        state.deleteConfirm.deleting = true;
        clearError();
        render();
        try {
            const currentName = row.currentNames && row.currentNames.length ? row.currentNames[0] : null;
            const originalVi = currentName && currentName.vi ? currentName.vi : (row.displayVi || row.currentVi || '');
            if (!state.editor.nameCv && !state.editor.namePy) {
                const data = await requestNameCheck(row, originalVi);
                state.editor.nameCv = normalizeSpace(data.name_cv || '');
                state.editor.namePy = normalizeSpace(data.name_py || '');
            }
            const payload = await requestFormJson('/name', [
                ['bookId', state.book.id],
                ['nameCn', row.nameCn],
                ['nameCv', state.editor.nameCv || ''],
                ['namePy', state.editor.namePy || ''],
                ['nameVi', originalVi],
                ['submit', 'del'],
                ['listType', row.listType || 1],
            ], {
                folderIds: [state.selectedFolderId],
                useEditCookie: true,
            });
            if (!payload || payload.err !== 0) {
                throw new Error('Xóa name thất bại.');
            }
            state.deleteConfirm.open = false;
            await refreshFolderAfterMutation(state.selectedFolderId, {
                type: 'delete',
                nameCn: row.nameCn,
                localEvents: [createLocalHistoryEvent('delete', {
                    before: {
                        cn: row.nameCn,
                        vi: originalVi,
                    },
                })],
                selectedNameKey: row.key,
            }, `Đã xóa name ${row.nameCn}.`);
        } finally {
            state.deleteConfirm.deleting = false;
            render();
        }
    }

    function handleSelectChange(target) {
        const name = target.getAttribute('data-select');
        if (name === 'statusFilter') {
            state.statusFilter = target.value || 'all';
        } else if (name === 'sortBy') {
            state.sortBy = target.value || 'latest';
        }
        render();
    }

    function handleInputChange(target) {
        const name = target.getAttribute('data-input');
        if (name === 'search') {
            state.search = target.value || '';
            render();
            return;
        }
        if (name === 'edit-name-vi') {
            state.editor.nameVi = target.value || '';
            return;
        }
        if (name === 'add-cn') {
            state.editor.addCn = target.value || '';
            return;
        }
        if (name === 'add-vi') {
            state.editor.addVi = target.value || '';
            return;
        }
        if (name === 'bulk-names') {
            state.editor.bulkText = target.value || '';
        }
    }

    async function handleAction(action, target) {
        if (action === 'toggle-panel') {
            if (state.ignoreNextFabClick) {
                state.ignoreNextFabClick = false;
                return;
            }
            state.panelOpen = !state.panelOpen;
            render();
            if (state.panelOpen && !state.initialized) {
                await ensureInitialized(false);
            }
            return;
        }

        if (action === 'open-panel') {
            state.panelOpen = true;
            state.guideOpen = false;
            render();
            if (!state.initialized) {
                await ensureInitialized(false);
            }
            return;
        }

        if (action === 'close-panel') {
            state.panelOpen = false;
            render();
            return;
        }

        if (action === 'open-help') {
            openGuide('help');
            return;
        }

        if (action === 'close-guide') {
            closeGuide();
            return;
        }

        if (action === 'cancel-delete') {
            closeDeleteConfirm();
            return;
        }

        if (action === 'refresh-folders') {
            await ensureInitialized(true);
            return;
        }

        if (action === 'refresh-folder') {
            await refreshCurrentFolder();
            return;
        }

        if (action === 'toggle-sidebar') {
            state.sidebarCollapsed = !state.sidebarCollapsed;
            render();
            return;
        }

        if (action === 'select-folder') {
            await selectFolder(target.getAttribute('data-folder-id') || '');
            return;
        }

        if (action === 'scan-history') {
            if (!state.selectedFolderId) {
                return;
            }
            try {
                await scanFolderHistory(state.selectedFolderId, true);
            } catch (error) {
                setError(error);
                render();
            }
            return;
        }

        if (action === 'show-summary') {
            state.selectedNameKey = '';
            render();
            return;
        }

        if (action === 'show-add-panel') {
            state.selectedNameKey = '';
            render();
            setTimeout(() => {
                const input = state.shadow ? state.shadow.querySelector('[data-input="add-cn"]') : null;
                if (input) {
                    input.focus();
                }
            }, 0);
            return;
        }

        if (action === 'copy-folder') {
            await copyCurrentFolder();
            return;
        }

        if (action === 'add-single') {
            await addNames([{
                cn: normalizeSpace(state.editor.addCn),
                vi: normalizeSpace(state.editor.addVi),
            }]);
            return;
        }

        if (action === 'add-bulk') {
            await addNames(parseBulkPairs(state.editor.bulkText));
            return;
        }

        if (action === 'check-name') {
            await checkSelectedNameSuggestion();
            return;
        }

        if (action === 'pick-suggestion') {
            state.editor.nameVi = target.getAttribute('data-suggestion') || '';
            render();
            return;
        }

        if (action === 'save-name') {
            await saveSelectedNameEdit();
            return;
        }

        if (action === 'confirm-delete') {
            const row = getSelectedRow();
            if (row) {
                openDeleteConfirm(row);
            }
            return;
        }

        if (action === 'delete-name') {
            await deleteSelectedName();
            return;
        }

        if (action === 'download-names') {
            await downloadCurrentFolderNames();
            return;
        }

        if (action === 'export-csv') {
            await exportCurrentCsv();
            return;
        }

        if (action === 'export-json') {
            await exportCurrentJson();
            return;
        }

        if (action === 'select-name') {
            state.selectedNameKey = target.getAttribute('data-name-key') || '';
            render();
        }
    }

    function attachEvents() {
        if (!state.shadow) {
            return;
        }

        let draggingFab = false;
        let dragMoved = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        function getDragPoint(event) {
            if (event.touches && event.touches.length) {
                return event.touches[0];
            }
            if (event.changedTouches && event.changedTouches.length) {
                return event.changedTouches[0];
            }
            return event;
        }

        function moveFabTo(left, top, persist) {
            const button = state.shadow && state.shadow.querySelector('.wknm-fab');
            if (!button) {
                return;
            }

            const rect = button.getBoundingClientRect();
            const margin = 8;
            const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
            const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
            const nextPosition = {
                left: Math.round(Math.min(Math.max(margin, left), maxLeft)),
                top: Math.round(Math.min(Math.max(margin, top), maxTop)),
            };

            button.style.left = `${nextPosition.left}px`;
            button.style.top = `${nextPosition.top}px`;
            button.style.right = 'auto';
            button.style.bottom = 'auto';
            state.fabPosition = nextPosition;

            if (persist) {
                saveFabPosition(nextPosition);
            }
        }

        function onFabDragStart(event) {
            const button = event.target.closest('.wknm-fab');
            if (!button) {
                return;
            }
            if (typeof event.button === 'number' && event.button !== 0) {
                return;
            }

            const point = getDragPoint(event);
            const rect = button.getBoundingClientRect();
            draggingFab = true;
            dragMoved = false;
            dragOffsetX = point.clientX - rect.left;
            dragOffsetY = point.clientY - rect.top;
            button.style.transition = 'none';
            button.style.cursor = 'grabbing';

            if (!state.fabPosition) {
                state.fabPosition = {
                    left: Math.round(rect.left),
                    top: Math.round(rect.top),
                };
            }

            event.preventDefault();
        }

        function onFabDragMove(event) {
            if (!draggingFab) {
                return;
            }

            const point = getDragPoint(event);
            moveFabTo(point.clientX - dragOffsetX, point.clientY - dragOffsetY, false);
            dragMoved = true;
            event.preventDefault();
        }

        function onFabDragEnd() {
            if (!draggingFab) {
                return;
            }

            draggingFab = false;
            const button = state.shadow && state.shadow.querySelector('.wknm-fab');
            if (button) {
                button.style.removeProperty('transition');
                button.style.removeProperty('cursor');
            }

            syncFabButtonToViewport(true);
            if (dragMoved) {
                state.ignoreNextFabClick = true;
                setTimeout(() => {
                    state.ignoreNextFabClick = false;
                }, 220);
            }
        }

        state.shadow.addEventListener('click', async (event) => {
            const actionNode = event.target.closest('[data-action]');
            if (!actionNode) {
                return;
            }
            event.preventDefault();
            const action = actionNode.getAttribute('data-action');
            try {
                await handleAction(action, actionNode);
            } catch (error) {
                setError(error);
                render();
            }
        });

        state.shadow.addEventListener('input', (event) => {
            const input = event.target.closest('[data-input]');
            if (input) {
                handleInputChange(input);
            }
        });

        state.shadow.addEventListener('change', (event) => {
            const select = event.target.closest('[data-select]');
            if (select) {
                handleSelectChange(select);
            }
        });

        state.shadow.addEventListener('mousedown', onFabDragStart);
        state.shadow.addEventListener('touchstart', onFabDragStart, { passive: false });
        window.addEventListener('mousemove', onFabDragMove);
        window.addEventListener('touchmove', onFabDragMove, { passive: false });
        window.addEventListener('mouseup', onFabDragEnd);
        window.addEventListener('touchend', onFabDragEnd);
        window.addEventListener('touchcancel', onFabDragEnd);
        window.addEventListener('resize', () => {
            syncFabButtonToViewport(true);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') {
                return;
            }
            if (state.guideOpen) {
                state.guideOpen = false;
                render();
                return;
            }
            if (state.deleteConfirm.open) {
                state.deleteConfirm.open = false;
                state.deleteConfirm.deleting = false;
                render();
                return;
            }
            if (state.panelOpen) {
                state.panelOpen = false;
                render();
            }
        });
    }

    function mount() {
        if (state.mounted || !document.body) {
            return;
        }
        const host = document.createElement('div');
        host.id = HOST_ID;
        document.body.appendChild(host);
        const shadow = host.attachShadow({ mode: 'open' });

        state.host = host;
        state.shadow = shadow;
        state.mounted = true;
        state.fabPosition = sanitizeFabPosition(storageGet(FAB_POSITION_STORAGE_KEY, null));

        attachEvents();
        state.book = detectBookMeta();
        render();
        setTimeout(() => {
            runVersionCheck();
        }, GUIDE_CHECK_DELAY);
    }

    function waitForBody() {
        if (document.body) {
            mount();
            return;
        }
        const timer = setInterval(() => {
            if (document.body) {
                clearInterval(timer);
                mount();
            }
        }, 200);
    }

    waitForBody();
})();
