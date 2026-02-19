// ==UserScript==
// @name         Auto Volume/Chapter Uploader
// @namespace    http://tampermonkey.net/
// @version      1.2.6.2
// @description  Tự động hóa quá trình thêm/bổ sung chương trên wiki và web hồng
// @author       QuocBao
// @icon         data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAFgAAACgAAABAAAAAgAAAAAEAIAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAADaxiYA2sYmAdrGJnPaxibZ2sYm+9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibf2sYmgNrGJgbaxiYA2sYmAtrGJpzaxib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiaw2sYmCNrGJm3axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJn/axibd2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibl2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cUg/9jDG//Ywxr/2MMZ/9jDGf/Ywxr/2cQd/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSL/2cQd/9jDGv/Ywxn/2MMZ/9jDGf/Ywxv/2cQe/9rFI//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUi/9jDGv/Ywxr/28cp/+DORf/l12X/6dx6/+vgh//r4If/6Nt1/+PTVv/dyjT/2cQe/9jDGf/ZxB//2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cQd/9jDGf/ZxSD/3cs3/+PUWv/o3Hf/6+CH/+vgh//q3oH/5tls/+HRT//cyC7/2cQc/9jDGf/ZxSD/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/2MMa/93LN//n2nL/8eqt//n23P/+/vr//////////////////////////////////Prs//Xvw//r4In/4M9G/9nEHf/ZxB3/2sYm/9rGJP/Ywxr/2sYm/+LTVf/t45L/9vHI//377v//////////////////////////////////////+/jk//PtuP/p3n//381B/9nEHP/ZxB7/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/Ywxj/3sw7/+/moP/9++7///////////////////////////////////////////////////////////////////////7++f/z7bf/4dFN/9jCF//axiX/6d16//j01f////////////////////////////////////////////////////////////////////////////799f/y67L/4M9I/9jDGP/axiT/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nFIf/ZxR//6d19//z77P/////////////////////////////////////////////////////////////////////////////////////////////++//w56T/9/LN//////////////////////////////////////////////////////////////////////////////////////////////////799v/s4Yr/2sYj/9nEH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEH//byCz/8+yz//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Xww//dyzj/2cQc/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEHv/cyS//9/LN//////////////////////////////////////////////////389P/7+OT/+PXX//n12P/8+un////9///////////////////////////////////////////////////////////////////////////////9//z66//59tz/+PTV//r33//8++7/////////////////////////////////////////////////+vji/+HQSf/Zwxv/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nFIP/cyS//9/LN///////////////////////////////////////59tv/7eOS/+PUWv/ezDv/3Mgt/9rGJf/axib/3Mkx/+DQSf/p3Xr/9vHI//////////////////////////////////////////////////799f/z7LX/6Ntz/+DQSf/cyTL/28co/9rGJP/bxyr/3co1/+LSUP/r34X/9/PQ///////////////////////////////////////7+ej/385C/9nEHf/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/ZxR//9O68//////////////////////////////////r44v/o23X/28co/9jCGP/ZxBz/2cUh/9rGI//axiX/2sYk/9rFI//ZxB//2MMY/9nFIP/k1V//9vLL/////////////////////////////v76/+/mnv/fzT//2MMb/9jDGf/ZxB//2sUj/9rGJP/axiX/2sYk/9rFIv/ZxB7/2MMY/9rFIv/l1mP/+fXX//////////////////////////////////n12P/byCv/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/6t6B//////////////////////////////////Pstv/cyjL/2MMX/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMa/9rFIv/r4Ib//fvv////////////+fXY/+LSUf/Ywxf/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMZ/9vIKf/w6KX/////////////////////////////////8emr/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/380///788/////////////////////////////Hpqf/ZxB7/2cUg/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSH/2MMX//bwxf//////9e/A/9zJLf/Zwxv/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/2MMa/+zhiv/////////////////////////////////m2Gf/2cQa/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMa//Hpqf////////////////////////////PstP/ZxB7/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMZ/+3jkv//////9fDE/9rGJv/ZxR//2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/Ywxf/7uSW////////////////////////////+vfh/9vIKv/axiP/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUh/97MO//+/fX///////////////////////r44f/cyS7/2cUg/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+PTVf////7/+/jj/93KMv/ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYj/9nFHv/178H////////////////////////////p3Xv/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDGv/o3Hf////////////////////////////n2m//2MMY/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYl/9rFIv/388///////+TWYP/Ywxn/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/381A//388///////////////////////+PTS/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/8+y2///////////////////////59tv/2sYm/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSP/2cUh/9rFIv/axiX/2sYm/9nEG//m12b///////Pstf/Ywxr/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUj/9nFIf/ZxSL/2sYl/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDF//u5Zr//////////////////////////P/gz0j/2cUf/9rGJv/axib/2sYm/9rGJv/axiT/3Mgs//v45P//////////////////////7eKR/9jDGP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFI//Ywxv/3Mkv/97MPv/dyzf/2cQf/9nEHv/ZxB3/9e/C///////h0U7/2cQd/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiP/2MMa/9zILv/ezD7/3cs4/9nEH//ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/381A//799v//////////////////////6d5+/9jDGf/axib/2sYm/9rGJv/axib/2cQe/+HRTv////7//////////////////////+LSU//ZxB3/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFIv/bxyj/7uSW//v45P/+/fb//fvv//Tuu//fzkL/3co0///++//38sv/2cQe/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/28cn/+3jlP/7+OP//v32//378P/07r3/4dBK/9nEHP/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/28MX///////////////////////Lrs//ZxBv/2sYm/9rGJv/axib/2sYm/9jDGv/o23b///////////////////////z67P/cyjL/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSD/8+23////////////////////////////+/nl/+3jk///////6t5+/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2cUg//PstP////////////////////////////377//gz0X/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/7eKP///////////////////////59tz/28cn/9rGJP/axib/2sYm/9rGJv/Ywxn/7uSZ///////////////////////489D/2sUi/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/5tlr///////////////////////////////////////////////8/+HQSf/ZxR//2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+bYaP//////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYaf///////////////////////fzz/97MOv/axSH/2sYm/9rGJv/axib/2MMb//LqsP//////////////////////9O26/9jDHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe//XwxP////////////////////////////////////////////v55v/cyC3/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/177/////////////////////////////////////////+/P/gz0f/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i01T///////////////////////7++//fzkT/2cUg/9rGJv/axib/2sYm/9nEHf/07r////////////////////////Dopv/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUi/93LNv/9/PH////////////////////////////////////////////38s3/2sUh/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rFIv/dyjT//fvu////////////////////////////////////////////6dx5/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56H/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lD/////////////////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4dFO/////////////////////////////////////////////////+/mnf/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBz/5ddl//////////////////////////////////////////////////Ptuf/ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+XWY//////////////////////////////////////////////////z7LX/2cQb/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bZa//////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//n2Gn/////////////////////////////////////////////////9e68/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGP/axiX/2sYl/9rGJf/axiX/2sYl/9rGJf/Ywxr/5thq//////////////////////////////////////////////////Ptuf/YxBv/2sYl/9rGJf/axiX/2sYl/9rGJf/axiX/2MMa/+bXaP/////////////////////////////////////////////////07bv/2cQb/9rGJf/axiX/2sYl/9rGJf/axiX/2sYl/9nEHf/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/078D//////////////////////+/mn//XwRL/2cQf/9nEH//ZxB//2cQf/9nEH//ZxB//18EU/+XXZv/////////////////////////////////////////////////z7bf/18IV/9nEH//ZxB//2cQf/9nEH//ZxB//2cQf/9fBFP/l1mP/////////////////////////////////////////////////9O25/9jCFf/ZxB//2cQf/9nEH//ZxB//2cQf/9nEH//Ywhf/4dFO///////////////////////+/vv/385E/9nFIP/axib/2sYm/9rGJv/ZxBz/8+25///////////////////////7+ej/9fDE//bxyP/28cj/9vHI//bxyP/28cj/9vHI//Xwxf/59dn//////////////////////////////////////////////////Pvt//Xwxf/28cj/9vHI//bxyP/28cj/9vHI//bxyP/18MX/+fXZ//////////////////////////////////////////////////z77v/28MX/9vHI//bxyP/28cj/9vHI//bxyP/28cj/9vDG//j00////////////////////////v73/9/NP//ZxSH/2sYm/9rGJv/axib/2MMZ/+zijf/////////////////////////////////////////////////////////////////////////////////////////////////+/ff//////////////////////////////////////////////////////////////////////////////////////////////////v33//////////////////////////////////////////////////////////////////////////////////////////////////n22//bxib/2sYk/9rGJv/axib/2sYm/9nEHv/i0U/////+////////////////////////////////////////////////////////////////////////////////////////////7eOT//z66////////////////////////////////////////////////////////////////////////////////////////////+7klv/7+eb////////////////////////////////////////////////////////////////////////////////////////////v5pz/2MMa/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+3klf//////////////////////////////////////////////////////////////////////////////////////9fDD/9jDGf/p3Xz///////////////////////////////////////////////////////////////////////////////////////bxyP/ZxBv/6Nt1///////////////////////////////////////////////////////////////////////////////////////59tr/3Mkv/9rFIv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/axSH/6+CJ//378P///////////////////////////////////////////////////////////////////vz/8uqu/9zILv/ZxSD/2cQd/+ncef/8+uz////////////////////////////////////////////////////////////////////9//Lqr//cyS//2cUg/9nEHf/o3Hj//Prr/////////////////////////////////////////////////////////////////////v/07rv/3sw5/9nEHv/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYk/9jDG//ezDv/5thp/+3jkv/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kl//o3Hj/4M9I/9nEH//axSH/2sYn/9rGJf/Ywxv/3cs3/+XXZ//t45H/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jf/6dx6/+DQSv/ZxB//2cUh/9rGJ//axiX/2MMb/93LNv/l12X/7eKQ/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+ndfP/h0Ez/2sUi/9nFH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUh/9jDG//Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMa/9nEH//axiX/2sYm/9rGJv/axib/2sYm/9rFIv/Ywxv/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGv/ZxB//2sYl/9rGJv/axib/2sYm/9rGJv/axSL/2cQc/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxr/2cQf/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axibW2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibf2sYmX9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmcdrGJgDaxiaH2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmnNrGJgPaxiYA2sYmANrGJmHaxibR2sYm+trGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibX2sYmb9rGJgDaxiYAgAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAwAAAAAAAAAM=
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Auto%20Volume%20Chapter%20Uploader.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Auto%20Volume%20Chapter%20Uploader.user.js
// @require      https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Wikidich_Autofill.user.js?v=0.3.6.1
// @match        https://wikicv.net/nhung-file
// @match        https://wikicv.net/truyen/*/chinh-sua
// @match        https://koanchay.org/nhung-file
// @match        https://koanchay.org/truyen/*/chinh-sua
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      api5-normal-sinfonlineb.fqnovel.com
// @connect      app.jjwxc.net
// @connect      po18.tw
// @connect      ihuaben.com
// @connect      qidian.com
// @connect      qimao.com
// @connect      gongzicp.com
// @connect      generativelanguage.googleapis.com
// @connect      dichngay.com
// @connect      fanqiesdkpic.com
// @connect      *
// ==/UserScript==

(function () {
    'use strict';
    const { hostname, pathname } = window.location;
    const parts = pathname.split('/').filter(p => p.length > 0);
    if (parts[0] === 'truyen' && parts.at(-1) === 'chinh-sua') {
        const count = parts.length;
        if (count === 4) {
            console.log('[WDU] Trang chỉnh sửa CHƯƠNG → không chạy script.');
            return;
        }
    }
    // --- Cấu hình ---
    const APP_PREFIX = 'WDU_';
    const CURRENT_VERSION = '1.2.6';
    const VERSION_KEY = `${APP_PREFIX}version`;
    const VOLUME_STATS_KEY = `${APP_PREFIX}volume_stats_enabled`;
    const SHARED_THEME_KEY = 'WDX_theme';
    const DEFAULT_THEME_MODE = 'light';
    const SNAPSHOTS_KEY = `${APP_PREFIX}snapshots_v1`;
    const SNAPSHOT_MAX_ITEMS = 40;
    // Use IndexedDB for heavier snapshot storage. Still cap per snapshot to avoid freezing/quotas.
    const SNAPSHOT_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB per snapshot (raw bytes)
    // Fallback only (e.g. IndexedDB unavailable): keep tiny inline base64.
    const SNAPSHOT_MAX_INLINE_FILE_BYTES = 512 * 1024;
    const SNAPSHOT_DB_NAME = `${APP_PREFIX}snapshots_db_v1`;
    const SNAPSHOT_DB_STORE = 'files';
    let settings = {
        LOG_MAX_LINES: 1000,
        FILE_SIZE_WARNING_KB: 4,
        USE_FIRST_LINE_ONLY: false,
        CHAPTER_NAME_TEMPLATE: '第{num}章 {title}',
        PARSE_PRIORITY: 'filename',
        THEME_MODE: DEFAULT_THEME_MODE,
    };
    const SETTINGS_KEY = `${APP_PREFIX}settings`;

    // --- Trạng thái của Script ---
    let state = {
        isEditPage: /^\/truyen\/[^\/]+\/chinh-sua$/.test(location.pathname),
        isNewBookPage: /^\/nhung-file$/.test(location.pathname),
        selectedVolumeWrapper: null,
        allFiles: [],
        validFiles: [],
        invalidFiles: [],
        volumeStatsEnabled: GM_getValue(VOLUME_STATS_KEY, null),
        volumeStatsData: null,
        bookOwner: null,
        bookOwnerPromise: null,
    };

    // --- Tạo UI trong Shadow DOM để tránh xung đột CSS ---
    const shadowHost = document.createElement('div');
    shadowHost.id = `${APP_PREFIX}host`;
    document.body.appendChild(shadowHost);
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    let themeMedia = null;
    let themeListener = null;
    const resolveTheme = (mode) => {
        if (mode === 'dark' || mode === 'light') return mode;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    };
    const applyTheme = (mode) => {
        const resolved = resolveTheme(mode);
        shadowHost.setAttribute('data-theme', resolved);
        if (mode === 'auto' && window.matchMedia) {
            if (!themeMedia) {
                themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
                themeListener = () => {
                    shadowHost.setAttribute('data-theme', themeMedia.matches ? 'dark' : 'light');
                };
                themeMedia.addEventListener('change', themeListener);
            }
        } else if (themeMedia && themeListener) {
            themeMedia.removeEventListener('change', themeListener);
            themeMedia = null;
            themeListener = null;
        }
    };
    const pageStyle = document.createElement('style');
    pageStyle.textContent = `
        .${APP_PREFIX}volume-stats {
            margin-top: 6px;
            padding: 6px 10px;
            border-radius: 10px;
            background: linear-gradient(135deg, #fef6ff 0%, #eef5ff 100%);
            border: 1px solid rgba(123, 76, 255, 0.12);
            color: #563a7c;
            font-size: 12px;
            display: inline-flex;
            gap: 6px;
            align-items: center;
            flex-wrap: wrap;
        }
        .${APP_PREFIX}volume-stats b {
            color: #1f1b2e;
        }
    `;
    document.head.appendChild(pageStyle);

    // --- CSS cho giao diện ---
    const css = `
        :host {
            all: initial;
            --wdu-primary: #ff8a65;
            --wdu-primary-strong: #ff7043;
            --wdu-secondary: #26c6da;
            --wdu-secondary-strong: #00acc1;
            --wdu-danger: #ef5350;
            --wdu-danger-strong: #e53935;
            --wdu-surface: #ffffff;
            --wdu-surface-2: #f6f8ff;
            --wdu-border: rgba(98, 110, 140, 0.18);
            --wdu-shadow: 0 18px 40px rgba(53, 64, 90, 0.2);
            --wdu-text: #2f2a36;
            --wdu-muted: #6b6f80;
            --wdu-radius: 14px;
        }
        :host([data-theme="dark"]) {
            --wdu-surface: #0b1220;
            --wdu-surface-2: #111827;
            --wdu-border: rgba(148, 163, 184, 0.25);
            --wdu-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
            --wdu-text: #e5e7eb;
            --wdu-muted: #a3a3b5;
        }
        #${APP_PREFIX}panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 360px;
            max-height: 480px;
            background: linear-gradient(180deg, #ffffff 0%, #f6f8ff 100%);
            border: 1px solid var(--wdu-border);
            border-radius: var(--wdu-radius);
            box-shadow: var(--wdu-shadow);
            z-index: 99999;
            font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
            font-size: 14px;
            color: var(--wdu-text);
            display: flex;
            flex-direction: column;
            backdrop-filter: blur(2px);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}panel {
            background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
            border-color: var(--wdu-border);
            color: var(--wdu-text);
        }
        #${APP_PREFIX}header {
            padding: 10px 14px;
            background: linear-gradient(90deg, #ffe4f4 0%, #e5f3ff 100%);
            border-bottom: 1px solid rgba(0,0,0,0.06);
            font-size: 15px;
            font-weight: 600;
            cursor: move;
            border-top-left-radius: var(--wdu-radius);
            border-top-right-radius: var(--wdu-radius);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}header {
            background: linear-gradient(90deg, #111827 0%, #0f172a 100%);
            border-bottom-color: rgba(148, 163, 184, 0.15);
            color: #e5e7eb;
        }
        #${APP_PREFIX}header-title {
            display: flex;
            align-items: baseline;
            gap: 6px;
            flex: 1;
            color: #4a2c6f;
            letter-spacing: 0.2px;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}header-title {
            color: #e5e7eb;
        }
        #${APP_PREFIX}header-title span {
            display: inline-flex;
        }
        #${APP_PREFIX}header-badge {
            font-size: 11px;
            font-weight: 700;
            color: #5a4a82;
            background: rgba(255,255,255,0.7);
            padding: 2px 6px;
            border-radius: 999px;
            border: 1px solid rgba(90, 90, 130, 0.2);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}header-badge {
            color: #c7d2fe;
            background: rgba(15, 23, 42, 0.8);
            border-color: rgba(148, 163, 184, 0.25);
        }
        #${APP_PREFIX}header-actions {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        #${APP_PREFIX}content {
            padding: 14px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(245,248,255,0.85) 100%);
            border-top: 1px solid rgba(255,255,255,0.7);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}content {
            background: linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(17, 24, 39, 0.92) 100%);
            border-top-color: rgba(148, 163, 184, 0.12);
        }
        #${APP_PREFIX}log-container {
            background: linear-gradient(180deg, #111827 0%, #0b1220 100%);
            color: #e2e8f0;
            font-family: "JetBrains Mono", "Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 12px;
            height: 200px;
            overflow-y: auto;
            padding: 10px;
            border-radius: 10px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
            margin-top: 10px;
        }
        #${APP_PREFIX}log-container div {
            margin-bottom: 5px;
            white-space: pre-wrap;
            overflow-wrap: break-word; /* Tùy chọn ngắt từ hiện đại */
            word-wrap: break-word;     /* Tương thích ngược */
        }
        .${APP_PREFIX}log-time { color: #94a3b8; margin-right: 5px; }
        .${APP_PREFIX}log-warn { color: #fbbf24; }
        .${APP_PREFIX}log-error { color: #f87171; }
        .${APP_PREFIX}log-success { color: #34d399; }
        .${APP_PREFIX}btn {
            background: linear-gradient(135deg, var(--wdu-primary) 0%, #ffb74d 100%);
            color: #fff !important;
            border: none;
            padding: 10px 14px;
            text-align: center;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            margin: 4px 0;
            cursor: pointer;
            border-radius: 10px;
            width: 100%;
            box-sizing: border-box;
            font-weight: 600;
            gap: 6px;
            box-shadow: 0 10px 18px rgba(255, 138, 101, 0.25);
            transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
        }
        .${APP_PREFIX}btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 20px rgba(255, 138, 101, 0.32);
        }
        .${APP_PREFIX}btn:active { transform: translateY(0); }
        .${APP_PREFIX}btn:disabled {
            background: #b0b7c3;
            box-shadow: none;
            cursor: not-allowed;
            opacity: 0.75;
        }
        .${APP_PREFIX}btn-secondary {
            background: linear-gradient(135deg, var(--wdu-secondary) 0%, #42a5f5 100%);
            box-shadow: 0 10px 18px rgba(38, 198, 218, 0.26);
        }
        .${APP_PREFIX}btn-secondary:hover {
            box-shadow: 0 12px 20px rgba(38, 198, 218, 0.34);
        }
        .${APP_PREFIX}btn-danger {
            background: linear-gradient(135deg, var(--wdu-danger) 0%, #ff8a80 100%);
            box-shadow: 0 10px 18px rgba(239, 83, 80, 0.28);
        }
        .${APP_PREFIX}btn-danger:hover {
            box-shadow: 0 12px 20px rgba(239, 83, 80, 0.36);
        }
        .${APP_PREFIX}btn-ghost {
            background: rgba(255,255,255,0.75);
            color: #3f3d56 !important;
            border: 1px solid rgba(90, 96, 116, 0.25);
            box-shadow: none;
        }
        .${APP_PREFIX}btn-autofill {
            position: relative;
            background: linear-gradient(135deg, #4fc3f7 0%, #7e57c2 100%);
            box-shadow: 0 12px 22px rgba(79, 195, 247, 0.25);
        }
        .${APP_PREFIX}btn-autofill:hover { box-shadow: 0 14px 26px rgba(79, 195, 247, 0.32); }
        .${APP_PREFIX}autofill-icon {
            width: 18px;
            height: 18px;
            margin-right: 6px;
            vertical-align: -3px;
            filter: drop-shadow(0 0 4px rgba(130, 200, 255, 0.8));
        }
        .${APP_PREFIX}autofill-icon .${APP_PREFIX}lens {
            fill: none;
            stroke: rgba(220, 245, 255, 0.9);
            stroke-width: 1.8;
        }
        .${APP_PREFIX}autofill-icon .${APP_PREFIX}spark {
            fill: none;
            stroke: rgba(255, 255, 255, 0.9);
            stroke-width: 1.4;
            stroke-linecap: round;
            animation: ${APP_PREFIX}sparkle-stroke 1.6s ease-in-out infinite;
        }
        .${APP_PREFIX}btn-autofill::before {
            content: "";
            position: absolute;
            inset: -6px;
            border-radius: 6px;
            border: 2px solid rgba(79, 195, 247, 0.7);
            box-shadow: 0 0 8px rgba(79, 195, 247, 0.65);
            animation: ${APP_PREFIX}sparkle 1.8s ease-in-out infinite;
            pointer-events: none;
        }
        .${APP_PREFIX}beta {
            position: absolute;
            right: -6px;
            bottom: -6px;
            background: #ffeb3b;
            color: #1a1a1a;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 999px;
            border: 1px solid #f5c400;
            text-transform: uppercase;
        }
        @keyframes ${APP_PREFIX}sparkle {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.04); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
        }
        @keyframes ${APP_PREFIX}sparkle-stroke {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }
        .${APP_PREFIX}select, .${APP_PREFIX}text-input {
            width: 100%;
            padding: 8px;
            margin-bottom: 5px;
            border: 1px solid rgba(110, 120, 150, 0.25);
            border-radius: 10px;
            background-color: #fff;
            color: #2f2a36;
            box-shadow: inset 0 1px 2px rgba(16, 24, 40, 0.06);
            box-sizing: border-box;
            font-family: inherit;
            font-size: 13px;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}select,
        :host([data-theme="dark"]) .${APP_PREFIX}text-input {
            background-color: #0f172a;
            color: #e5e7eb;
            border-color: rgba(148, 163, 184, 0.3);
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
        }
        .${APP_PREFIX}notice {
            font-size: 12px;
            color: var(--wdu-muted);
            margin-top: 5px;
            line-height: 1.4;
        }
        #${APP_PREFIX}manual-input {
            border-top: 1px dashed #ccc;
            padding-top: 10px;
            margin-top: 10px;
        }
        .${APP_PREFIX}manual-file-entry {
            margin-bottom: 8px;
            padding: 5px;
            background: #eee;
            border-radius: 4px;
        }
        .${APP_PREFIX}manual-file-entry label {
            font-size: 12px;
            font-weight: bold;
            display: block;
            margin-bottom: 3px;
            color: #d9534f;
        }
        .${APP_PREFIX}button-group {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .${APP_PREFIX}button-group .${APP_PREFIX}btn {
            width: auto;
            margin: 0;
            flex: 1;
        }
        .${APP_PREFIX}btn-add-volume {
            flex: 1.1;
        }
        .${APP_PREFIX}button-group .${APP_PREFIX}btn-danger {
            flex: 0 0 92px;
        }
        #${APP_PREFIX}settings-btn {
            background: rgba(255,255,255,0.8);
            border: 1px solid rgba(90, 100, 120, 0.2);
            padding: 4px;
            margin: 0;
            cursor: pointer;
            color: #4a4a6a;
            line-height: 1;
            border-radius: 8px;
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}settings-btn,
        :host([data-theme="dark"]) #${APP_PREFIX}help-btn,
        :host([data-theme="dark"]) #${APP_PREFIX}minimize-btn {
            background: rgba(30, 41, 59, 0.85);
            border-color: rgba(148, 163, 184, 0.25);
            color: #e2e8f0;
        }
        #${APP_PREFIX}settings-btn:hover {
            color: #1f1f2b;
            background: #fff;
        }
        #${APP_PREFIX}help-btn {
            background: rgba(255,255,255,0.8);
            border: 1px solid rgba(90, 100, 120, 0.2);
            padding: 4px;
            margin: 0;
            cursor: pointer;
            color: #4a4a6a;
            line-height: 1;
            font-weight: 700;
            border-radius: 8px;
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        #${APP_PREFIX}help-btn:hover {
            color: #1f1f2b;
            background: #fff;
        }
        #${APP_PREFIX}minimize-btn {
            background: rgba(255,255,255,0.8);
            border: 1px solid rgba(90, 100, 120, 0.2);
            padding: 4px;
            margin: 0;
            cursor: pointer;
            color: #4a4a6a;
            line-height: 1;
            font-weight: 700;
            border-radius: 8px;
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        #${APP_PREFIX}minimize-btn:hover {
            color: #1f1f2b;
            background: #fff;
        }

        .${APP_PREFIX}hide {
            display: none !important;
        }

        #${APP_PREFIX}floating-icon {
            position: fixed;
            right: 20px;
            bottom: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff9a8b 0%, #ff6a88 60%, #ff99ac 100%);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 24px rgba(255, 105, 135, 0.35);
            font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            cursor: move;
            z-index: 99999;
            user-select: none;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}floating-icon {
            background: linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 60%, #1e3a8a 100%);
            box-shadow: 0 10px 24px rgba(30, 64, 175, 0.45);
        }
        #${APP_PREFIX}floating-icon span {
            pointer-events: none;
        }

        #${APP_PREFIX}settings-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0,0,0,0.5);
            z-index: 100000;
        }

        #${APP_PREFIX}settings-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 420px;
            max-height: 80vh;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 100001;
            display: flex;
            flex-direction: column;
            color: #333;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}settings-modal {
            background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
            color: #e5e7eb;
            border: 1px solid rgba(148, 163, 184, 0.25);
            box-shadow: 0 18px 40px rgba(0,0,0,0.45);
        }
        .${APP_PREFIX}modal-header {
            padding: 12px 15px;
            font-size: 16px;
            font-weight: bold;
            border-bottom: 1px solid #e5e5e5;
            flex: 0 0 auto;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}modal-header {
            border-bottom-color: rgba(148, 163, 184, 0.2);
            color: #e2e8f0;
        }
        .${APP_PREFIX}modal-content {
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            flex: 1 1 auto;
            overflow-y: auto;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}modal-content {
            color: #cbd5f5;
        }
        .${APP_PREFIX}setting-item label {
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }
        .${APP_PREFIX}setting-item .${APP_PREFIX}text-input {
            margin-bottom: 3px;
        }
        .${APP_PREFIX}modal-footer {
            padding: 10px 15px;
            border-top: 1px solid #e5e5e5;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            flex: 0 0 auto;
            background-color: #fff;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}modal-footer {
            background-color: #0f172a;
            border-top-color: rgba(148, 163, 184, 0.2);
        }
        .${APP_PREFIX}modal-footer .${APP_PREFIX}btn {
            width: auto;
            margin: 0;
        }
        .${APP_PREFIX}btn-cancel {
            background: #757575 !important;
            box-shadow: 0 10px 18px rgba(117, 117, 117, 0.25) !important;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}btn-cancel {
            background: #475569 !important;
        }

        #${APP_PREFIX}help-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 640px;
            max-width: 92vw;
            max-height: 82vh;
            background: linear-gradient(135deg, #fff7fb 0%, #f2f8ff 100%);
            border-radius: 14px;
            border: 1px solid rgba(0,0,0,0.06);
            box-shadow: 0 18px 40px rgba(63, 81, 181, 0.25);
            z-index: 100002;
            display: flex;
            flex-direction: column;
            color: #222;
            font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
            font-size: 14px;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}help-modal {
            background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
            color: #e5e7eb;
            border-color: rgba(148, 163, 184, 0.2);
        }
        #${APP_PREFIX}help-header {
            padding: 12px 16px;
            font-size: 16px;
            font-weight: 600;
            border-bottom: 1px solid rgba(0,0,0,0.06);
            background: linear-gradient(90deg, #fce4ec, #e3f2fd);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}help-header {
            background: linear-gradient(90deg, #0f172a, #111827);
            border-bottom-color: rgba(148, 163, 184, 0.2);
            color: #e2e8f0;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}help-title {
            color: #e2e8f0;
        }
        #${APP_PREFIX}help-content {
            padding: 14px 16px;
            overflow-y: auto;
            line-height: 1.55;
        }
        #${APP_PREFIX}help-content h3 {
            margin: 12px 0 6px;
            font-size: 15px;
            color: #6a1b9a;
        }
        #${APP_PREFIX}help-content code {
            background: #fff0f6;
            padding: 1px 4px;
            border-radius: 4px;
        }
        #${APP_PREFIX}help-content ul {
            padding-left: 20px;
            margin: 6px 0 12px;
        }
        #${APP_PREFIX}help-content::-webkit-scrollbar,
        #${APP_PREFIX}content::-webkit-scrollbar,
        #${APP_PREFIX}log-container::-webkit-scrollbar,
        #${APP_PREFIX}settings-modal .${APP_PREFIX}modal-content::-webkit-scrollbar {
            width: 10px;
        }
        #${APP_PREFIX}help-content::-webkit-scrollbar-track,
        #${APP_PREFIX}content::-webkit-scrollbar-track,
        #${APP_PREFIX}log-container::-webkit-scrollbar-track,
        #${APP_PREFIX}settings-modal .${APP_PREFIX}modal-content::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.7);
            border-radius: 999px;
        }
        #${APP_PREFIX}help-content::-webkit-scrollbar-thumb,
        #${APP_PREFIX}content::-webkit-scrollbar-thumb,
        #${APP_PREFIX}settings-modal .${APP_PREFIX}modal-content::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #ffb3d5 0%, #a6c8ff 100%);
            border-radius: 999px;
            border: 2px solid rgba(255,255,255,0.8);
        }
        #${APP_PREFIX}log-container::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #7dd3fc 0%, #38bdf8 100%);
            border-radius: 999px;
            border: 2px solid rgba(15, 23, 42, 0.9);
        }
        #${APP_PREFIX}help-content,
        #${APP_PREFIX}content,
        #${APP_PREFIX}log-container,
        #${APP_PREFIX}settings-modal .${APP_PREFIX}modal-content {
            scrollbar-width: thin;
            scrollbar-color: #ffb3d5 rgba(255,255,255,0.7);
        }
        #${APP_PREFIX}log-container {
            scrollbar-color: #38bdf8 rgba(15, 23, 42, 0.8);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}help-content {
            color: #e5e7eb;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}help-content h3 {
            color: #c7d2fe;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}help-content code {
            background: #1f2937;
            color: #f9a8d4;
            border: 1px solid rgba(148, 163, 184, 0.2);
        }
        :host([data-theme="dark"]) .${APP_PREFIX}welcome-banner {
            background: linear-gradient(135deg, #1f2937, #111827) !important;
            border-left-color: #38bdf8 !important;
            color: #e5e7eb;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}welcome-banner strong {
            color: #f9a8d4;
        }
        .${APP_PREFIX}welcome-title {
            color: #7b1fa2;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}welcome-title {
            color: #f0abfc;
        }
        .${APP_PREFIX}welcome-sub {
            color: #6a5b9a;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}welcome-sub {
            color: #c4b5fd;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}help-content::-webkit-scrollbar-track,
        :host([data-theme="dark"]) #${APP_PREFIX}content::-webkit-scrollbar-track,
        :host([data-theme="dark"]) #${APP_PREFIX}log-container::-webkit-scrollbar-track,
        :host([data-theme="dark"]) #${APP_PREFIX}settings-modal .${APP_PREFIX}modal-content::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.8);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}help-content::-webkit-scrollbar-thumb,
        :host([data-theme="dark"]) #${APP_PREFIX}content::-webkit-scrollbar-thumb,
        :host([data-theme="dark"]) #${APP_PREFIX}settings-modal .${APP_PREFIX}modal-content::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #64748b 0%, #1f2937 100%);
            border: 2px solid rgba(15, 23, 42, 0.9);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}help-content,
        :host([data-theme="dark"]) #${APP_PREFIX}content,
        :host([data-theme="dark"]) #${APP_PREFIX}settings-modal .${APP_PREFIX}modal-content {
            scrollbar-color: #64748b rgba(15, 23, 42, 0.8);
        }
        #${APP_PREFIX}update-banner {
            margin: 8px 0 12px;
            padding: 10px 12px;
            border-radius: 12px;
            background: linear-gradient(135deg, #ffe7f3 0%, #e8f3ff 100%);
            border: 1px solid rgba(255, 143, 194, 0.4);
            box-shadow: 0 8px 18px rgba(255, 143, 194, 0.2);
        }
        #${APP_PREFIX}update-banner strong {
            color: #7a1d5a;
        }
        #${APP_PREFIX}help-close {
            padding: 4px 10px;
            font-size: 12px;
            min-height: unset;
            width: auto;
            flex: 0 0 auto;
        }
        #${APP_PREFIX}controls {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        #${APP_PREFIX}controls label {
            font-weight: 600;
            color: #4a2c6f;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}controls label {
            color: #e5e7eb;
        }
        #${APP_PREFIX}fake-upload {
            font-weight: 700;
            letter-spacing: 0.2px;
        }
        #${APP_PREFIX}web-actions {
            flex-wrap: nowrap;
        }
        #${APP_PREFIX}web-actions .${APP_PREFIX}btn {
            min-width: 0;
            padding: 9px 10px;
            white-space: nowrap;
        }
        #${APP_PREFIX}web-actions #${APP_PREFIX}fake-upload {
            flex: 1.35;
        }
        #${APP_PREFIX}snapshots-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 16, 28, 0.45);
            backdrop-filter: blur(2px);
            z-index: 100003;
        }
        #${APP_PREFIX}snapshots-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 780px;
            max-width: 96vw;
            max-height: 86vh;
            background: linear-gradient(180deg, #fff7f9 0%, #fff 100%);
            border-radius: 16px;
            border: 1px solid rgba(128, 90, 213, 0.18);
            box-shadow: 0 26px 60px rgba(60, 26, 96, 0.35);
            z-index: 100004;
            color: #2a2334;
            font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}snapshots-modal {
            background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
            color: #e5e7eb;
            border-color: rgba(148, 163, 184, 0.22);
            box-shadow: 0 26px 60px rgba(0, 0, 0, 0.5);
        }
        #${APP_PREFIX}snapshots-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 12px 14px;
            background: linear-gradient(90deg, #ffe8ee, #efe6ff);
            border-bottom: 1px solid rgba(0,0,0,0.06);
            font-weight: 800;
            color: #5a2a68;
        }
        #${APP_PREFIX}snapshots-header .${APP_PREFIX}btn {
            width: auto;
            margin: 0;
            padding: 4px 9px;
            min-height: 28px;
            font-size: 12px;
            border-radius: 10px;
            box-shadow: none;
        }
        #${APP_PREFIX}snapshots-header .${APP_PREFIX}btn:hover {
            transform: none;
            box-shadow: none;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}snapshots-header {
            background: linear-gradient(90deg, rgba(88, 28, 135, 0.25), rgba(2, 132, 199, 0.18));
            color: #e5e7eb;
            border-bottom-color: rgba(148, 163, 184, 0.18);
        }
        #${APP_PREFIX}snapshots-tools {
            padding: 10px 14px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
            border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        #${APP_PREFIX}snapshots-tools .${APP_PREFIX}btn {
            width: auto;
            margin: 0;
            padding: 6px 10px;
            font-size: 12px;
            border-radius: 10px;
            min-height: 32px;
            box-shadow: none;
        }
        #${APP_PREFIX}snapshots-tools .${APP_PREFIX}btn:hover {
            transform: none;
            box-shadow: none;
        }
        #${APP_PREFIX}snapshots-tools .${APP_PREFIX}btn-danger,
        #${APP_PREFIX}snapshots-tools .${APP_PREFIX}btn-secondary {
            box-shadow: none;
        }
        #${APP_PREFIX}snapshots-tools .${APP_PREFIX}btn:disabled {
            opacity: 0.55;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}snapshots-tools {
            border-bottom-color: rgba(148, 163, 184, 0.14);
        }
        #${APP_PREFIX}snapshots-tools .${APP_PREFIX}notice {
            margin: 0;
            flex: 1 1 260px;
            color: #6a5b9a;
            font-size: 12px;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}snapshots-tools .${APP_PREFIX}notice {
            color: rgba(226, 232, 240, 0.75);
        }
        #${APP_PREFIX}snapshots-list {
            padding: 12px 14px;
            overflow: auto;
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
        }
        .${APP_PREFIX}snapshots-card {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 12px;
            border-radius: 14px;
            border: 1px solid rgba(90, 100, 120, 0.18);
            background: rgba(255, 255, 255, 0.85);
            cursor: pointer;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}snapshots-card {
            background: rgba(2, 6, 23, 0.35);
            border-color: rgba(148, 163, 184, 0.22);
        }
        .${APP_PREFIX}snapshots-card[data-selected="true"] {
            border-color: rgba(124, 58, 237, 0.55);
            box-shadow: 0 10px 22px rgba(124, 58, 237, 0.16);
        }
        :host([data-theme="dark"]) .${APP_PREFIX}snapshots-card[data-selected="true"] {
            border-color: rgba(56, 189, 248, 0.55);
            box-shadow: 0 10px 22px rgba(2, 132, 199, 0.2);
        }
        .${APP_PREFIX}snapshots-card input[type="checkbox"] {
            margin-top: 3px;
        }
        .${APP_PREFIX}snapshots-meta {
            flex: 1 1 auto;
            min-width: 0;
        }
        .${APP_PREFIX}snapshots-title {
            font-weight: 800;
            color: #2b1a33;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}snapshots-title {
            color: #e5e7eb;
        }
        .${APP_PREFIX}snapshots-sub {
            margin-top: 4px;
            font-size: 12px;
            color: #6b6f80;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        :host([data-theme="dark"]) .${APP_PREFIX}snapshots-sub {
            color: rgba(226, 232, 240, 0.7);
        }
        #${APP_PREFIX}snapshots-empty {
            padding: 16px;
            border-radius: 14px;
            border: 1px dashed rgba(90, 100, 120, 0.25);
            color: #6b6f80;
            background: rgba(255,255,255,0.75);
            text-align: center;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}snapshots-empty {
            background: rgba(2, 6, 23, 0.35);
            border-color: rgba(148, 163, 184, 0.25);
            color: rgba(226, 232, 240, 0.75);
        }
        #${APP_PREFIX}confirm-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 16, 28, 0.45);
            backdrop-filter: blur(2px);
            z-index: 100003;
        }
        #${APP_PREFIX}confirm-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 380px;
            max-width: 92vw;
            background: linear-gradient(180deg, #fff7f9 0%, #fff 100%);
            border-radius: 14px;
            border: 1px solid rgba(231, 88, 120, 0.25);
            box-shadow: 0 20px 40px rgba(120, 43, 64, 0.3);
            z-index: 100004;
            color: #3b2d33;
            font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
            overflow: hidden;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}confirm-modal {
            background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
            color: #e5e7eb;
            border-color: rgba(148, 163, 184, 0.2);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
        }
        #${APP_PREFIX}confirm-header {
            padding: 12px 16px;
            font-weight: 700;
            color: #7a1d2f;
            background: linear-gradient(90deg, #ffe8ee, #ffeefd);
            border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        #${APP_PREFIX}confirm-body {
            padding: 12px 16px;
            font-size: 13px;
            line-height: 1.5;
        }
        #${APP_PREFIX}confirm-body strong {
            color: #c62828;
        }
        #${APP_PREFIX}confirm-extra {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        #${APP_PREFIX}confirm-extra label {
            font-weight: 600;
            color: #7a1d2f;
        }
        #${APP_PREFIX}confirm-extra .${APP_PREFIX}confirm-hint {
            font-size: 12px;
            color: #7c6b78;
        }
        #${APP_PREFIX}confirm-warning {
            margin-top: 10px;
            padding: 8px 10px;
            border-radius: 10px;
            background: #ffe9e9;
            border: 1px solid #f3b1b1;
            color: #b71c1c;
            font-size: 12px;
        }
        #${APP_PREFIX}confirm-owner-error {
            font-size: 12px;
            color: #c62828;
        }
        #${APP_PREFIX}confirm-actions {
            padding: 12px 16px;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            border-top: 1px solid rgba(0,0,0,0.06);
            background: rgba(255,255,255,0.8);
        }
        #${APP_PREFIX}confirm-actions .${APP_PREFIX}btn {
            width: auto;
            margin: 0;
            min-width: 90px;
        }
        #${APP_PREFIX}dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 16, 28, 0.5);
            backdrop-filter: blur(2px);
            z-index: 100009;
        }
        #${APP_PREFIX}dialog-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 560px;
            max-width: 96vw;
            background: linear-gradient(180deg, #fff7f9 0%, #fff 100%);
            border-radius: 14px;
            border: 1px solid rgba(120, 128, 160, 0.25);
            box-shadow: 0 20px 40px rgba(40, 48, 74, 0.3);
            z-index: 100010;
            color: #2f2a36;
            font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
            overflow: hidden;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}dialog-modal {
            background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
            color: #e5e7eb;
            border-color: rgba(148, 163, 184, 0.25);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
        }
        #${APP_PREFIX}dialog-title {
            padding: 12px 16px;
            font-weight: 700;
            background: linear-gradient(90deg, #ffe8ee, #edf5ff);
            border-bottom: 1px solid rgba(0,0,0,0.06);
            color: #4a2c6f;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}dialog-title {
            background: linear-gradient(90deg, #0f172a, #1f2937);
            color: #e5e7eb;
            border-bottom-color: rgba(148, 163, 184, 0.2);
        }
        #${APP_PREFIX}dialog-message {
            padding: 12px 16px;
            font-size: 13px;
            line-height: 1.55;
            white-space: pre-line;
            max-height: min(52vh, 420px);
            overflow-y: auto;
        }
        #${APP_PREFIX}dialog-actions {
            padding: 12px 16px;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            border-top: 1px solid rgba(0,0,0,0.06);
            background: rgba(255,255,255,0.82);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}dialog-actions {
            background: rgba(15, 23, 42, 0.9);
            border-top-color: rgba(148, 163, 184, 0.2);
        }
        #${APP_PREFIX}dialog-actions .${APP_PREFIX}btn {
            width: auto;
            margin: 0;
            min-width: 90px;
        }
        .${APP_PREFIX}volume-stats {
            margin-top: 6px;
            padding: 6px 10px;
            border-radius: 10px;
            background: linear-gradient(135deg, #fef6ff 0%, #eef5ff 100%);
            border: 1px solid rgba(123, 76, 255, 0.12);
            color: #563a7c;
            font-size: 12px;
            display: inline-flex;
            gap: 6px;
            align-items: center;
            flex-wrap: wrap;
        }
        .${APP_PREFIX}volume-stats b {
            color: #1f1b2e;
        }
        #${APP_PREFIX}pref-overlay {
            position: fixed;
            inset: 0;
            background: rgba(18, 16, 30, 0.55);
            backdrop-filter: blur(2px);
            z-index: 100005;
        }
        #${APP_PREFIX}pref-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 380px;
            max-width: 92vw;
            background: linear-gradient(160deg, #fff1f8 0%, #f2f7ff 100%);
            border-radius: 16px;
            border: 1px solid rgba(255, 151, 205, 0.4);
            box-shadow: 0 22px 46px rgba(83, 56, 112, 0.32);
            z-index: 100006;
            overflow: hidden;
            color: #2f223a;
            font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}pref-modal {
            background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
            color: #e5e7eb;
            border-color: rgba(148, 163, 184, 0.2);
            box-shadow: 0 22px 46px rgba(0, 0, 0, 0.45);
        }
        #${APP_PREFIX}pref-header {
            padding: 12px 16px;
            font-weight: 700;
            background: linear-gradient(90deg, #ffd7eb 0%, #dcedff 100%);
            border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        #${APP_PREFIX}pref-body {
            padding: 12px 16px;
            font-size: 13px;
            line-height: 1.5;
        }
        #${APP_PREFIX}pref-actions {
            padding: 12px 16px;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            border-top: 1px solid rgba(0,0,0,0.06);
            background: rgba(255,255,255,0.85);
        }
        #${APP_PREFIX}theme-pref-overlay {
            position: fixed;
            inset: 0;
            background: rgba(18, 16, 30, 0.55);
            backdrop-filter: blur(2px);
            z-index: 100007;
        }
        #${APP_PREFIX}theme-pref-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 420px;
            max-width: 92vw;
            background: linear-gradient(160deg, #fff1f8 0%, #f2f7ff 100%);
            border-radius: 16px;
            border: 1px solid rgba(255, 151, 205, 0.4);
            box-shadow: 0 22px 46px rgba(83, 56, 112, 0.32);
            z-index: 100008;
            overflow: hidden;
            color: #2f223a;
            font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}theme-pref-modal {
            background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
            color: #e5e7eb;
            border-color: rgba(148, 163, 184, 0.2);
            box-shadow: 0 22px 46px rgba(0, 0, 0, 0.45);
        }
        #${APP_PREFIX}theme-pref-header {
            padding: 12px 16px;
            font-weight: 700;
            background: linear-gradient(90deg, #ffd7eb 0%, #dcedff 100%);
            border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}theme-pref-header {
            background: linear-gradient(90deg, #0f172a 0%, #1f2937 100%);
            color: #f3f4f6;
        }
        #${APP_PREFIX}theme-pref-body {
            padding: 12px 16px;
            font-size: 13px;
            line-height: 1.5;
        }
        #${APP_PREFIX}theme-pref-actions {
            padding: 12px 16px;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            border-top: 1px solid rgba(0,0,0,0.06);
            background: rgba(255,255,255,0.85);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}theme-pref-actions {
            background: rgba(15, 23, 42, 0.9);
            border-top-color: rgba(148, 163, 184, 0.2);
        }
        #${APP_PREFIX}theme-pref-actions .${APP_PREFIX}btn {
            width: auto;
            margin: 0;
            min-width: 90px;
        }
        #${APP_PREFIX}upload-toast {
            position: fixed;
            left: 50%;
            top: calc(env(safe-area-inset-top, 0px) + 14px);
            transform: translate(-50%, -16px) scale(0.92);
            opacity: 0;
            z-index: 100200;
            pointer-events: none;
            padding: 10px 16px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.62);
            color: #fff;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: 0.15px;
            font-family: "Be Vietnam Pro", "Nunito", "Noto Sans", "Segoe UI", Arial, sans-serif;
            box-shadow: 0 14px 28px rgba(25, 35, 70, 0.3);
            background: linear-gradient(135deg, #ff7eb3 0%, #7afcff 100%);
            backdrop-filter: blur(6px);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: opacity 0.26s ease, transform 0.3s ease;
        }
        #${APP_PREFIX}upload-toast::before {
            content: '✦';
            font-size: 14px;
            animation: ${APP_PREFIX}toast-spin 1.15s linear infinite;
        }
        #${APP_PREFIX}upload-toast.enter {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
            animation: ${APP_PREFIX}toast-float 1.25s ease-in-out infinite;
        }
        #${APP_PREFIX}upload-toast.exit {
            opacity: 0;
            transform: translate(-50%, -22px) scale(0.94);
            animation: none;
        }
        #${APP_PREFIX}upload-toast[data-state="success"] {
            background: linear-gradient(135deg, #43a047, #26c6da);
        }
        #${APP_PREFIX}upload-toast[data-state="success"]::before {
            content: '✓';
            animation: none;
        }
        #${APP_PREFIX}upload-toast[data-state="error"] {
            background: linear-gradient(135deg, #e53935, #ef5350);
        }
        #${APP_PREFIX}upload-toast[data-state="error"]::before {
            content: '!';
            animation: none;
        }
        :host([data-theme="dark"]) #${APP_PREFIX}upload-toast {
            border-color: rgba(148, 163, 184, 0.35);
            color: #f8fafc;
            box-shadow: 0 16px 30px rgba(2, 6, 23, 0.62);
            background: linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}upload-toast[data-state="success"] {
            background: linear-gradient(135deg, #16a34a, #0f766e);
        }
        :host([data-theme="dark"]) #${APP_PREFIX}upload-toast[data-state="error"] {
            background: linear-gradient(135deg, #dc2626, #be123c);
        }
        @keyframes ${APP_PREFIX}toast-float {
            0%, 100% { box-shadow: 0 14px 28px rgba(25, 35, 70, 0.3); }
            50% { box-shadow: 0 18px 34px rgba(66, 165, 245, 0.36); }
        }
        @keyframes ${APP_PREFIX}toast-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    // --- HTML cho giao diện ---
    const panelHTML = `
        <style>${css}</style>
        <div id="${APP_PREFIX}upload-toast" data-state="loading"></div>
        <div id="${APP_PREFIX}floating-icon">
            <span>WDU</span>
        </div>
        <div id="${APP_PREFIX}panel">
            <div id="${APP_PREFIX}header">
                <div id="${APP_PREFIX}header-title">
                    <span>Auto Uploader</span>
                    <span id="${APP_PREFIX}header-badge">v${CURRENT_VERSION}</span>
                </div>
                <div id="${APP_PREFIX}header-actions">
                    <button id="${APP_PREFIX}settings-btn" title="Cài đặt">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.58-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.49.49 0 0 0-.49-.41h-3.84a.49.49 0 0 0-.49.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.58.22L2.73 9.42a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.61-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.2.37.29.58.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54a.49.49 0 0 0 .49.41h3.84c.27 0 .49-.18.49-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.21.08.47 0 .58-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
                    </button>
                    <button id="${APP_PREFIX}help-btn" title="Hướng dẫn">?</button>
                    <button id="${APP_PREFIX}minimize-btn" title="Thu nhỏ">✕</button>
                </div>
            </div>
                <div id="${APP_PREFIX}content">
                    <div id="${APP_PREFIX}controls">
                        <label for="${APP_PREFIX}volume-select"><b>1. Chọn Quyển:</b></label>
                        <select id="${APP_PREFIX}volume-select" class="${APP_PREFIX}select">
                            <option value="-1" disabled selected>-- Chọn quyển để thêm chương --</option>
                        </select>
                    <div class="${APP_PREFIX}button-group">
                        <button id="${APP_PREFIX}upload-btn" class="${APP_PREFIX}btn" disabled>Files TXT</button>
                        <button id="${APP_PREFIX}add-volume" class="${APP_PREFIX}btn ${APP_PREFIX}btn-secondary ${APP_PREFIX}btn-add-volume">Add New</button>
                        <button id="${APP_PREFIX}delete-volume" class="${APP_PREFIX}btn ${APP_PREFIX}btn-danger" disabled>🗑 Xóa</button>
                    </div>
                    <div id="${APP_PREFIX}web-actions" class="${APP_PREFIX}button-group">
                        <button id="${APP_PREFIX}fake-upload" class="${APP_PREFIX}btn ${APP_PREFIX}btn-secondary">🚀 Tải lên</button>
                        <button id="${APP_PREFIX}snap-save" class="${APP_PREFIX}btn ${APP_PREFIX}btn-secondary">💾 Lưu</button>
                        <button id="${APP_PREFIX}snap-open" class="${APP_PREFIX}btn ${APP_PREFIX}btn-secondary">🗂 Bản lưu</button>
                    </div>
                    <button id="${APP_PREFIX}autofill-btn" class="${APP_PREFIX}btn ${APP_PREFIX}btn-autofill">
                        <svg class="${APP_PREFIX}autofill-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <circle class="${APP_PREFIX}lens" cx="11" cy="11" r="6"></circle>
                            <line class="${APP_PREFIX}lens" x1="15.5" y1="15.5" x2="21" y2="21"></line>
                            <path class="${APP_PREFIX}spark" d="M6 5 L7 7 L9 8 L7 9 L6 11 L5 9 L3 8 L5 7 Z"></path>
                        </svg>
                        Autofill Thông tin<span class="${APP_PREFIX}beta">beta</span>
                    </button>

                    <p class="${APP_PREFIX}notice">
                        Tên file nên có dạng: 第123章... Script sẽ tự động phân tích từ tên file/dòng đầu, sắp xếp và điền file.
                    </p>
                    <div id="${APP_PREFIX}manual-input" style="display: none;"></div>
                </div>
                <div id="${APP_PREFIX}log-container"></div>
            </div>
        </div>
        <div id="${APP_PREFIX}settings-overlay" class="${APP_PREFIX}hide"></div>
        <div id="${APP_PREFIX}help-modal" class="${APP_PREFIX}hide">
            <div id="${APP_PREFIX}help-header">
                <span id="${APP_PREFIX}help-title">Hướng dẫn Auto Volume/Chapter Uploader</span>
                <button id="${APP_PREFIX}help-close" class="${APP_PREFIX}btn ${APP_PREFIX}btn-ghost">Đóng</button>
            </div>
            <div id="${APP_PREFIX}help-content"></div>
        </div>
        <div id="${APP_PREFIX}confirm-overlay" class="${APP_PREFIX}hide"></div>
        <div id="${APP_PREFIX}confirm-modal" class="${APP_PREFIX}hide">
            <div id="${APP_PREFIX}confirm-header">Xóa quyển này?</div>
            <div id="${APP_PREFIX}confirm-body">
                <div id="${APP_PREFIX}confirm-text">Bạn chắc chắn muốn xóa quyển đã chọn?</div>
                <div id="${APP_PREFIX}confirm-extra"></div>
            </div>
            <div id="${APP_PREFIX}confirm-actions">
                <button id="${APP_PREFIX}confirm-cancel" class="${APP_PREFIX}btn ${APP_PREFIX}btn-ghost">Hủy</button>
                <button id="${APP_PREFIX}confirm-ok" class="${APP_PREFIX}btn ${APP_PREFIX}btn-danger">Xóa</button>
            </div>
        </div>
        <div id="${APP_PREFIX}dialog-overlay" class="${APP_PREFIX}hide"></div>
        <div id="${APP_PREFIX}dialog-modal" class="${APP_PREFIX}hide">
            <div id="${APP_PREFIX}dialog-title">Thông báo</div>
            <div id="${APP_PREFIX}dialog-message"></div>
            <div id="${APP_PREFIX}dialog-actions">
                <button id="${APP_PREFIX}dialog-extra" class="${APP_PREFIX}btn ${APP_PREFIX}btn-ghost">Tùy chọn</button>
                <button id="${APP_PREFIX}dialog-cancel" class="${APP_PREFIX}btn ${APP_PREFIX}btn-ghost">Hủy</button>
                <button id="${APP_PREFIX}dialog-ok" class="${APP_PREFIX}btn ${APP_PREFIX}btn-secondary">Đồng ý</button>
            </div>
        </div>
        <div id="${APP_PREFIX}snapshots-overlay" class="${APP_PREFIX}hide"></div>
        <div id="${APP_PREFIX}snapshots-modal" class="${APP_PREFIX}hide">
            <div id="${APP_PREFIX}snapshots-header">
                <span>🗂 Bản lưu trạng thái</span>
                <button id="${APP_PREFIX}snapshots-close" class="${APP_PREFIX}btn ${APP_PREFIX}btn-ghost" title="Đóng">✕</button>
            </div>
            <div id="${APP_PREFIX}snapshots-tools">
                <button id="${APP_PREFIX}snapshots-select-all" class="${APP_PREFIX}btn ${APP_PREFIX}btn-ghost" title="Chọn tất cả">☑</button>
                <button id="${APP_PREFIX}snapshots-unselect" class="${APP_PREFIX}btn ${APP_PREFIX}btn-ghost" title="Bỏ chọn">☐</button>
                <button id="${APP_PREFIX}snapshots-delete" class="${APP_PREFIX}btn ${APP_PREFIX}btn-danger" title="Xóa" disabled>🗑</button>
                <button id="${APP_PREFIX}snapshots-restore" class="${APP_PREFIX}btn ${APP_PREFIX}btn-secondary" title="Khôi phục" disabled>↩</button>
                <div class="${APP_PREFIX}notice">Lưu file best-effort tối đa ~10MB/bản lưu (phụ thuộc quota trình duyệt). Khi khôi phục, file có thể thiếu nếu vượt giới hạn.</div>
            </div>
            <div id="${APP_PREFIX}snapshots-list"></div>
        </div>
        <div id="${APP_PREFIX}pref-overlay" class="${APP_PREFIX}hide"></div>
        <div id="${APP_PREFIX}pref-modal" class="${APP_PREFIX}hide">
            <div id="${APP_PREFIX}pref-header">Bật thống kê chương theo quyển?</div>
            <div id="${APP_PREFIX}pref-body">
                Hiển thị số chương + chương cuối cho từng quyển, và tổng số chương trong phần Cài đặt.
            </div>
            <div id="${APP_PREFIX}pref-actions">
                <button id="${APP_PREFIX}pref-disable" class="${APP_PREFIX}btn ${APP_PREFIX}btn-ghost">Tắt</button>
                <button id="${APP_PREFIX}pref-enable" class="${APP_PREFIX}btn ${APP_PREFIX}btn-secondary">Bật</button>
            </div>
        </div>
        <div id="${APP_PREFIX}theme-pref-overlay" class="${APP_PREFIX}hide"></div>
        <div id="${APP_PREFIX}theme-pref-modal" class="${APP_PREFIX}hide">
            <div id="${APP_PREFIX}theme-pref-header">Chọn giao diện</div>
            <div id="${APP_PREFIX}theme-pref-body">
                Bạn muốn dùng giao diện nào? Có thể đổi lại trong Cài đặt.
            </div>
            <div id="${APP_PREFIX}theme-pref-actions">
                <button id="${APP_PREFIX}theme-pref-light" class="${APP_PREFIX}btn ${APP_PREFIX}btn-ghost">Sáng</button>
                <button id="${APP_PREFIX}theme-pref-dark" class="${APP_PREFIX}btn">Tối</button>
                <button id="${APP_PREFIX}theme-pref-auto" class="${APP_PREFIX}btn ${APP_PREFIX}btn-secondary">Tự động</button>
            </div>
        </div>
        <div id="${APP_PREFIX}settings-modal" class="${APP_PREFIX}hide">
            <div class="${APP_PREFIX}modal-header">Cài đặt</div>
            <div class="${APP_PREFIX}modal-content">
                <div class="${APP_PREFIX}setting-item">
                    <label for="${APP_PREFIX}setting-log-max">Giới hạn dòng log:</label>
                    <input type="number" id="${APP_PREFIX}setting-log-max" class="${APP_PREFIX}text-input">
                    <span class="${APP_PREFIX}notice">Tránh lag nếu log quá nhiều. (Mặc định: 100)</span>
                </div>
                <div class="${APP_PREFIX}setting-item">
                    <label for="${APP_PREFIX}setting-file-kb">Cảnh báo file nhỏ (KB):</label>
                    <input type="number" id="${APP_PREFIX}setting-file-kb" class="${APP_PREFIX}text-input">
                    <span class="${APP_PREFIX}notice">Cảnh báo nếu file nhỏ hơn X KB. (Mặc định: 4)</span>
                </div>
                <div class="${APP_PREFIX}setting-item">
                    <label for="${APP_PREFIX}setting-theme">Giao diện:</label>
                    <select id="${APP_PREFIX}setting-theme" class="${APP_PREFIX}select">
                        <option value="light">Sáng</option>
                        <option value="dark">Tối</option>
                        <option value="auto">Tự động (theo hệ thống)</option>
                    </select>
                </div>

                <div class="${APP_PREFIX}setting-item" style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
                    <label>
                        <input type="checkbox" id="${APP_PREFIX}setting-first-line-only">
                        File tên số, dùng dòng đầu làm tiêu đề (bỏ parse số)
                    </label>
                    <span class="${APP_PREFIX}notice">
                        Sắp xếp theo tên file (000, 001...), lấy thẳng dòng đầu để điền tên chương.
                    </span>
                </div>

                <div class="${APP_PREFIX}setting-item" style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
                    <label for="${APP_PREFIX}setting-priority">Ưu tiên lấy thông tin từ:</label>
                    <select id="${APP_PREFIX}setting-priority" class="${APP_PREFIX}select">
                        <option value="filename">Tên File (Fallback -> Nội dung)</option>
                        <option value="content">Dòng đầu file (Fallback -> Tên File)</option>
                    </select>
                </div>

                <div class="${APP_PREFIX}setting-item" style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
                    <label>
                        <input type="checkbox" id="${APP_PREFIX}setting-volume-stats">
                        Hiện thống kê chương theo quyển
                    </label>
                    <div class="${APP_PREFIX}notice">Tổng số chương: <span id="${APP_PREFIX}setting-total-chapters">...</span></div>
                </div>

                <div class="${APP_PREFIX}setting-item">
                    <label for="${APP_PREFIX}setting-chapter-template">Mẫu tên chương:</label>
                    <input type="text" id="${APP_PREFIX}setting-chapter-template" class="${APP_PREFIX}text-input" placeholder="第{num}章 {title}">
                    <span class="${APP_PREFIX}notice">Ví dụ: <code>chương {num}: {title}</code> hoặc <code>{num}-{title}</code></span>
                </div>
            </div>
            <div class="${APP_PREFIX}modal-footer">
                <button id="${APP_PREFIX}settings-save" class="${APP_PREFIX}btn">Lưu</button>
                <button id="${APP_PREFIX}settings-cancel" class="${APP_PREFIX}btn ${APP_PREFIX}btn-cancel">Hủy</button>
            </div>
        </div>
    `;

    shadowRoot.innerHTML = panelHTML;

    // --- Kéo thả panel qua header ---
    const panelEl = shadowRoot.querySelector(`#${APP_PREFIX}panel`);
    const headerEl = shadowRoot.querySelector(`#${APP_PREFIX}header`);
    const floatingIconEl = shadowRoot.querySelector(`#${APP_PREFIX}floating-icon`);

    function enableDrag(panel, handle, storageKey) {
        const storagePosKey = storageKey || `${APP_PREFIX}panel_pos`;
        const ensureOnScreen = () => {
            const rect = panel.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            if (rect.left > vw - 50 || rect.top > vh - 50 || rect.left < 0 || rect.top < 0) {
                console.log('[WDU] Panel nằm ngoài vùng nhìn thấy -> Reset về mặc định.');
                panel.style.left = '';
                panel.style.top = '';
                panel.style.right = '20px';
                panel.style.bottom = '20px';
                localStorage.removeItem(storagePosKey);
                return;
            }
        };

        try {
            const saved = JSON.parse(localStorage.getItem(storagePosKey) || 'null');
            if (saved && typeof saved.left === 'string' && typeof saved.top === 'string') {
                panel.style.left = saved.left;
                panel.style.top = saved.top;
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';

                setTimeout(ensureOnScreen, 0);
            }
        } catch { }

        window.addEventListener('resize', () => {
            const rect = panel.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let newLeft = rect.left;
            let newTop = rect.top;

            if (newLeft + rect.width > vw) {
                newLeft = vw - rect.width - 10;
            }
            if (newTop + rect.height > vh) {
                newTop = vh - rect.height - 10;
            }

            panel.style.left = Math.max(0, newLeft) + 'px';
            panel.style.top = Math.max(0, newTop) + 'px';
        });

        let rect0 = null;
        let startX = 0, startY = 0;

        const onPointerDown = (e) => {
            if (e.target.closest(`#${APP_PREFIX}settings-btn`)) return;
            if (e.target.closest(`#${APP_PREFIX}help-btn`)) return;
            if (e.target.closest(`#${APP_PREFIX}minimize-btn`)) return;
            e.preventDefault();
            try { handle.setPointerCapture(e.pointerId); } catch { }
            handle.style.userSelect = 'none';

            rect0 = panel.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;

            panel.style.left = rect0.left + 'px';
            panel.style.top = rect0.top + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';

            const onPointerMove = (ev) => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                const pw = rect0.width;
                const ph = rect0.height;

                let newLeft = rect0.left + dx;
                let newTop = rect0.top + dy;

                newLeft = Math.max(0, Math.min(newLeft, vw - pw));
                newTop = Math.max(0, Math.min(newTop, vh - ph));

                panel.style.left = newLeft + 'px';
                panel.style.top = newTop + 'px';
            };

            const onPointerUp = (ev) => {
                try { handle.releasePointerCapture(ev.pointerId); } catch { }
                handle.removeEventListener('pointermove', onPointerMove);
                handle.removeEventListener('pointerup', onPointerUp);
                handle.style.userSelect = '';

                localStorage.setItem(storagePosKey, JSON.stringify({
                    left: panel.style.left,
                    top: panel.style.top
                }));
            };

            handle.addEventListener('pointermove', onPointerMove);
            handle.addEventListener('pointerup', onPointerUp);
        };

        handle.addEventListener('pointerdown', onPointerDown);
    }

    enableDrag(panelEl, headerEl, `${APP_PREFIX}panel_pos`);
    enableDrag(floatingIconEl, floatingIconEl, `${APP_PREFIX}icon_pos`);

    const logBox = shadowRoot.querySelector(`#${APP_PREFIX}log-container`);
    const uploadToastEl = shadowRoot.querySelector(`#${APP_PREFIX}upload-toast`);
    const uploadBtn = shadowRoot.querySelector(`#${APP_PREFIX}upload-btn`);
    const addVolumeBtn = shadowRoot.querySelector(`#${APP_PREFIX}add-volume`);
    const deleteVolumeBtn = shadowRoot.querySelector(`#${APP_PREFIX}delete-volume`);
    const volumeSelect = shadowRoot.querySelector(`#${APP_PREFIX}volume-select`);
    const manualInputContainer = shadowRoot.querySelector(`#${APP_PREFIX}manual-input`);
    const autofillBtn = shadowRoot.querySelector(`#${APP_PREFIX}autofill-btn`);
    const snapSaveBtn = shadowRoot.querySelector(`#${APP_PREFIX}snap-save`);
    const snapOpenBtn = shadowRoot.querySelector(`#${APP_PREFIX}snap-open`);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.multiple = true;

    if (!state.isNewBookPage && !state.isEditPage) {
        if (addVolumeBtn) addVolumeBtn.classList.add(`${APP_PREFIX}hide`);
        if (deleteVolumeBtn) deleteVolumeBtn.classList.add(`${APP_PREFIX}hide`);
    }

    // --- Biến cho Modal Cài đặt ---
    const settingsBtn = shadowRoot.querySelector(`#${APP_PREFIX}settings-btn`);
    const helpBtn = shadowRoot.querySelector(`#${APP_PREFIX}help-btn`);
    const minimizeBtn = shadowRoot.querySelector(`#${APP_PREFIX}minimize-btn`);
    const settingsOverlay = shadowRoot.querySelector(`#${APP_PREFIX}settings-overlay`);
    const settingsModal = shadowRoot.querySelector(`#${APP_PREFIX}settings-modal`);
    const helpModal = shadowRoot.querySelector(`#${APP_PREFIX}help-modal`);
    const helpCloseBtn = shadowRoot.querySelector(`#${APP_PREFIX}help-close`);
    const helpContent = shadowRoot.querySelector(`#${APP_PREFIX}help-content`);
    const confirmOverlay = shadowRoot.querySelector(`#${APP_PREFIX}confirm-overlay`);
    const confirmModal = shadowRoot.querySelector(`#${APP_PREFIX}confirm-modal`);
    const confirmText = shadowRoot.querySelector(`#${APP_PREFIX}confirm-text`);
    const confirmExtra = shadowRoot.querySelector(`#${APP_PREFIX}confirm-extra`);
    const confirmCancelBtn = shadowRoot.querySelector(`#${APP_PREFIX}confirm-cancel`);
    const confirmOkBtn = shadowRoot.querySelector(`#${APP_PREFIX}confirm-ok`);
    const dialogOverlay = shadowRoot.querySelector(`#${APP_PREFIX}dialog-overlay`);
    const dialogModal = shadowRoot.querySelector(`#${APP_PREFIX}dialog-modal`);
    const dialogTitle = shadowRoot.querySelector(`#${APP_PREFIX}dialog-title`);
    const dialogMessage = shadowRoot.querySelector(`#${APP_PREFIX}dialog-message`);
    const dialogExtraBtn = shadowRoot.querySelector(`#${APP_PREFIX}dialog-extra`);
    const dialogCancelBtn = shadowRoot.querySelector(`#${APP_PREFIX}dialog-cancel`);
    const dialogOkBtn = shadowRoot.querySelector(`#${APP_PREFIX}dialog-ok`);
    const snapshotsOverlay = shadowRoot.querySelector(`#${APP_PREFIX}snapshots-overlay`);
    const snapshotsModal = shadowRoot.querySelector(`#${APP_PREFIX}snapshots-modal`);
    const snapshotsCloseBtn = shadowRoot.querySelector(`#${APP_PREFIX}snapshots-close`);
    const snapshotsSelectAllBtn = shadowRoot.querySelector(`#${APP_PREFIX}snapshots-select-all`);
    const snapshotsUnselectBtn = shadowRoot.querySelector(`#${APP_PREFIX}snapshots-unselect`);
    const snapshotsDeleteBtn = shadowRoot.querySelector(`#${APP_PREFIX}snapshots-delete`);
    const snapshotsRestoreBtn = shadowRoot.querySelector(`#${APP_PREFIX}snapshots-restore`);
    const snapshotsListEl = shadowRoot.querySelector(`#${APP_PREFIX}snapshots-list`);
    const prefOverlay = shadowRoot.querySelector(`#${APP_PREFIX}pref-overlay`);
    const prefModal = shadowRoot.querySelector(`#${APP_PREFIX}pref-modal`);
    const prefEnableBtn = shadowRoot.querySelector(`#${APP_PREFIX}pref-enable`);
    const prefDisableBtn = shadowRoot.querySelector(`#${APP_PREFIX}pref-disable`);
    const themePrefOverlay = shadowRoot.querySelector(`#${APP_PREFIX}theme-pref-overlay`);
    const themePrefModal = shadowRoot.querySelector(`#${APP_PREFIX}theme-pref-modal`);
    const themePrefLightBtn = shadowRoot.querySelector(`#${APP_PREFIX}theme-pref-light`);
    const themePrefDarkBtn = shadowRoot.querySelector(`#${APP_PREFIX}theme-pref-dark`);
    const themePrefAutoBtn = shadowRoot.querySelector(`#${APP_PREFIX}theme-pref-auto`);
    const settingsSaveBtn = shadowRoot.querySelector(`#${APP_PREFIX}settings-save`);
    const settingsCancelBtn = shadowRoot.querySelector(`#${APP_PREFIX}settings-cancel`);
    const logMaxInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-log-max`);
    const fileSizeKbInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-file-kb`);
    const themeSelect = shadowRoot.querySelector(`#${APP_PREFIX}setting-theme`);
    const firstLineOnlyInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-first-line-only`);
    const chapterTemplateInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-chapter-template`);
    const volumeStatsCheckbox = shadowRoot.querySelector(`#${APP_PREFIX}setting-volume-stats`);
    const totalChaptersEl = shadowRoot.querySelector(`#${APP_PREFIX}setting-total-chapters`);
    const prioritySelect = shadowRoot.querySelector(`#${APP_PREFIX}setting-priority`);

    let iconDragged = false;

    function showPanel() {
        panelEl.classList.remove(`${APP_PREFIX}hide`);
        floatingIconEl.classList.add(`${APP_PREFIX}hide`);
    }

    function hidePanel() {
        panelEl.classList.add(`${APP_PREFIX}hide`);
        floatingIconEl.classList.remove(`${APP_PREFIX}hide`);
    }

    function renderHelpMarkdown(md) {
        const safe = md
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const lines = safe.split('\n');
        const htmlParts = [];
        let inList = false;

        const flushList = () => {
            if (inList) {
                htmlParts.push('</ul>');
                inList = false;
            }
        };

        lines.forEach((raw) => {
            const line = raw.trimEnd();
            if (line.startsWith('### ')) {
                flushList();
                htmlParts.push(`<h3>${line.slice(4)}</h3>`);
                return;
            }
            if (line.startsWith('- ')) {
                if (!inList) {
                    htmlParts.push('<ul>');
                    inList = true;
                }
                htmlParts.push(`<li>${line.slice(2)}</li>`);
                return;
            }
            if (line === '') {
                flushList();
                htmlParts.push('<div style="height:8px;"></div>');
                return;
            }
            flushList();
            htmlParts.push(`<div>${line}</div>`);
        });

        flushList();
        let html = htmlParts.join('\n');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        return html;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function decodeMaybe(text) {
        try {
            return decodeURIComponent(text);
        } catch {
            return text;
        }
    }

    function normalizeUserInput(value) {
        const raw = normalizeText(value);
        const decoded = normalizeText(decodeMaybe(raw));
        return decoded.toLowerCase();
    }

    function parseBookOwnerFromDoc(doc) {
        const managerDivs = Array.from(doc.querySelectorAll('.book-manager'));
        const getRole = (div) => normalizeText(div?.querySelector('.manager-role')?.textContent);
        const getSlug = (div) => {
            const a = div?.querySelector('.manager-name a[href^="/user/"]');
            if (!a) return '';
            const href = a.getAttribute('href') || '';
            const m = href.match(/\/user\/([^/]+)/);
            return m ? decodeMaybe(m[1]) : '';
        };
        const getName = (div) => normalizeText(div?.querySelector('.manager-name')?.textContent);

        const posterDiv = managerDivs.find(div => getRole(div) === 'Người đăng');
        let poster = posterDiv ? { slug: getSlug(posterDiv), name: getName(posterDiv) } : null;

        const adminItems = Array.from(doc.querySelectorAll('.book-admin-list .book-admin-item'));
        if ((!poster || (!poster.slug && !poster.name)) && adminItems.length > 0) {
            const ownerItem = adminItems.find(li => li.classList.contains('book-owner'));
            if (ownerItem) {
                const a = ownerItem.querySelector('.book-admin-link[href^="/user/"]');
                const href = a?.getAttribute('href') || '';
                const slugMatch = href.match(/\/user\/([^/]+)/);
                const slug = slugMatch ? decodeMaybe(slugMatch[1]) : (ownerItem.getAttribute('data-value') || '');
                const name = normalizeText(ownerItem.querySelector('.book-admin-name')?.textContent);
                poster = { slug, name };
            }
        }

        if (poster && (poster.slug || poster.name)) return poster;
        return null;
    }

    async function fetchBookOwner() {
        if (state.bookOwner) return state.bookOwner;
        if (state.bookOwnerPromise) return await state.bookOwnerPromise;
        if (!state.isEditPage) return null;
        const detailUrl = location.origin + location.pathname.replace(/\/chinh-sua$/, '');
        state.bookOwnerPromise = (async () => {
            try {
                const html = await fetchHtml(detailUrl);
                const detailDoc = toDoc(html);
                const owner = parseBookOwnerFromDoc(detailDoc);
                if (owner) state.bookOwner = owner;
                return owner;
            } catch (e) {
                log(`❌ Không tải được thông tin người đăng: ${e.message}`, 'error');
                return null;
            } finally {
                state.bookOwnerPromise = null;
            }
        })();
        return await state.bookOwnerPromise;
    }

    let pendingDelete = null;

    function getRealVolumeWrappers() {
        return Array.from(document.querySelectorAll('.volume-info-wrapper'))
            .filter(w => !w.closest('#volumeWrapperSample'));
    }

    function getVolumeDisplayName(wrapper, fallbackIndex = 0) {
        if (!wrapper) return `Quyển ${fallbackIndex + 1}`;
        const nameInput = wrapper.querySelector('input[name="nameCn"], input[name="name"]');
        const nameValue = nameInput ? nameInput.value.trim() : '';
        if (nameValue) return nameValue;
        const descEl = wrapper.querySelector('.volume-name-desc');
        const descText = descEl ? descEl.textContent.trim() : '';
        if (descText) return descText.replace(/^Ví dụ:\s*/i, '').trim();
        return `Quyển ${fallbackIndex + 1}`;
    }

    function isNewVolumeWrapper(wrapper) {
        if (!wrapper) return false;
        const id = wrapper.getAttribute('data-volume');
        if (!id) return true;
        return false;
    }

    function openDeleteConfirm() {
        if (!state.isNewBookPage && !state.isEditPage) {
            log('⚠️ Nút xóa quyển chỉ dùng ở trang Nhúng file hoặc Chỉnh sửa.', 'warn');
            return;
        }
        if (!state.selectedVolumeWrapper) {
            log('⚠️ Hãy chọn quyển trước khi xóa.', 'warn');
            return;
        }
        const wrappers = getRealVolumeWrappers();
        const selectedIndex = wrappers.indexOf(state.selectedVolumeWrapper);
        const selectedOption = volumeSelect.options[volumeSelect.selectedIndex];
        const cannotModify = selectedOption?.dataset?.cannotModify === 'true';
        const isAppendable = selectedOption?.dataset?.isAppendable === 'true';
        const isNewVolume = state.isEditPage ? isNewVolumeWrapper(state.selectedVolumeWrapper) : false;
        const requireOwner = state.isEditPage && !isNewVolume && (cannotModify || isAppendable);
        const displayName = getVolumeDisplayName(state.selectedVolumeWrapper, Math.max(selectedIndex, 0));
        pendingDelete = {
            wrapper: state.selectedVolumeWrapper,
            name: displayName,
            requireOwner,
            volumeIndex: selectedIndex,
            statsApplied: false
        };
        if (confirmText) {
            confirmText.innerHTML = `Bạn có chắc muốn xóa quyển <strong>${escapeHtml(displayName)}</strong>?<br>Hành động này không thể hoàn tác.`;
        }
        if (confirmExtra) {
            confirmExtra.innerHTML = '';
            if (requireOwner) {
                confirmExtra.innerHTML = `
                    <label for="${APP_PREFIX}confirm-owner">Xác nhận chủ truyện (Người đăng)</label>
                    <input id="${APP_PREFIX}confirm-owner" class="${APP_PREFIX}text-input" type="text" placeholder="Nhập username chủ truyện">
                    <div class="${APP_PREFIX}confirm-hint">Chấp nhận nhập dạng thường hoặc dạng encode.</div>
                    <div id="${APP_PREFIX}confirm-owner-error"></div>
                `;
                confirmExtra.insertAdjacentHTML(
                    'beforeend',
                    `<div id="${APP_PREFIX}confirm-warning">⚠️ Đây là bước xác nhận cuối. Sau khi bấm Xóa, hệ thống sẽ xóa quyển này trên web.</div>`
                );
            }
        }
        if (confirmOverlay) confirmOverlay.classList.remove(`${APP_PREFIX}hide`);
        if (confirmModal) confirmModal.classList.remove(`${APP_PREFIX}hide`);
    }

    function closeDeleteConfirm() {
        if (confirmModal) confirmModal.classList.add(`${APP_PREFIX}hide`);
        if (confirmOverlay) confirmOverlay.classList.add(`${APP_PREFIX}hide`);
        pendingDelete = null;
    }

    async function confirmDeleteVolume() {
        if (!pendingDelete || !pendingDelete.wrapper) {
            closeDeleteConfirm();
            return;
        }
        if (pendingDelete.requireOwner) {
            const inputEl = confirmExtra ? confirmExtra.querySelector(`#${APP_PREFIX}confirm-owner`) : null;
            const errorEl = confirmExtra ? confirmExtra.querySelector(`#${APP_PREFIX}confirm-owner-error`) : null;
            const inputValue = inputEl ? inputEl.value : '';
            const inputNorm = normalizeUserInput(inputValue);
            if (!inputNorm) {
                if (errorEl) errorEl.textContent = 'Vui lòng nhập username chủ truyện.';
                return;
            }
            if (errorEl) errorEl.textContent = '';

            const owner = state.bookOwner || await fetchBookOwner();
            if (!owner) {
                if (errorEl) errorEl.textContent = 'Không lấy được thông tin chủ truyện. Thử lại sau.';
                return;
            }
            const candidates = [owner.slug, owner.name].filter(Boolean).map(normalizeUserInput);
            if (!candidates.includes(inputNorm)) {
                if (errorEl) errorEl.textContent = 'Username không khớp với chủ truyện.';
                return;
            }
        }
        const removeBtn = pendingDelete.wrapper.querySelector('[data-action="removeVolume"]');
        if (!removeBtn) {
            log('❌ Không tìm thấy nút xóa của quyển.', 'error');
            pendingDelete = null;
            closeDeleteConfirm();
            return;
        }
        const applyVolumeStatsRemoval = () => {
            if (!state.isEditPage || !state.volumeStatsData || pendingDelete?.statsApplied) return;
            const idx = pendingDelete.volumeIndex;
            if (typeof idx !== 'number' || idx < 0) return;
            const removed = state.volumeStatsData.volumes?.[idx];
            if (removed) {
                state.volumeStatsData.total = Math.max(
                    0,
                    (state.volumeStatsData.total || 0) - (removed.count || 0)
                );
                state.volumeStatsData.volumes.splice(idx, 1);
                updateTotalChaptersDisplay(state.volumeStatsData.total);
            }
            const statsEl = pendingDelete.wrapper.querySelector(`.${APP_PREFIX}volume-stats`);
            if (statsEl) statsEl.remove();
            pendingDelete.statsApplied = true;
            setTimeout(() => {
                if (state.volumeStatsData) {
                    injectVolumeStatsToPage(state.volumeStatsData);
                }
            }, 200);
        };
        const clickWebConfirm = () => {
            const modal = document.querySelector('#mdRemoveVolume');
            if (!modal) return false;
            const okBtn = modal.querySelector('[data-action="confirmRemoveVolume"], .btn-confirm');
            if (!okBtn) return false;
            okBtn.click();
            applyVolumeStatsRemoval();
            return true;
        };
        removeBtn.click();
        log(`🗑 Đã yêu cầu xóa quyển "${pendingDelete.name}".`, 'warn');
        let tries = 0;
        const tryClick = () => {
            if (clickWebConfirm()) {
                log('✅ Đã xác nhận xóa trên web.', 'warn');
                return;
            }
            tries += 1;
            if (tries < 10) {
                setTimeout(tryClick, 200);
            } else {
                log('⚠️ Không tìm thấy popup xác nhận xóa của web. Vui lòng kiểm tra thủ công.', 'warn');
            }
        };
        setTimeout(tryClick, 120);
        pendingDelete = null;
        closeDeleteConfirm();
        setTimeout(() => {
            rebuildVolumeOptions('none');
            state.selectedVolumeWrapper = null;
            uploadBtn.disabled = true;
            if (deleteVolumeBtn) deleteVolumeBtn.disabled = true;
        }, 200);
    }

    function isVolumeStatsPrefUnset() {
        const val = GM_getValue(VOLUME_STATS_KEY, null);
        return val === null || typeof val === 'undefined';
    }

    function setVolumeStatsEnabled(enabled) {
        const value = !!enabled;
        GM_setValue(VOLUME_STATS_KEY, value);
        state.volumeStatsEnabled = value;
        if (volumeStatsCheckbox) volumeStatsCheckbox.checked = value;
        if (value) {
            loadVolumeStats(true);
        } else {
            clearVolumeStatsUI();
        }
    }

    function isThemePrefUnset() {
        const raw = localStorage.getItem(SHARED_THEME_KEY);
        const val = (raw || '').toLowerCase();
        return !['light', 'dark', 'auto'].includes(val);
    }

    function setThemeMode(mode) {
        const next = ['light', 'dark', 'auto'].includes(mode) ? mode : DEFAULT_THEME_MODE;
        settings.THEME_MODE = next;
        localStorage.setItem(SHARED_THEME_KEY, next);
        if (themeSelect) themeSelect.value = next;
        applyTheme(next);
        saveSettings();
    }

    function openThemePref() {
        if (!themePrefModal || !themePrefOverlay) return;
        if (!isThemePrefUnset()) return;
        themePrefOverlay.classList.remove(`${APP_PREFIX}hide`);
        themePrefModal.classList.remove(`${APP_PREFIX}hide`);
    }

    function closeThemePref() {
        if (themePrefModal) themePrefModal.classList.add(`${APP_PREFIX}hide`);
        if (themePrefOverlay) themePrefOverlay.classList.add(`${APP_PREFIX}hide`);
    }

    function maybeShowThemePref() {
        if (!isThemePrefUnset()) {
            maybeShowVolumeStatsPref();
            return;
        }
        if (helpModal && !helpModal.classList.contains(`${APP_PREFIX}hide`)) return;
        if (themePrefModal && !themePrefModal.classList.contains(`${APP_PREFIX}hide`)) return;
        if (prefModal && !prefModal.classList.contains(`${APP_PREFIX}hide`)) return;
        openThemePref();
    }

    function openVolumeStatsPref() {
        if (!prefModal || !prefOverlay) return;
        if (!isVolumeStatsPrefUnset()) return;
        prefOverlay.classList.remove(`${APP_PREFIX}hide`);
        prefModal.classList.remove(`${APP_PREFIX}hide`);
    }

    function closeVolumeStatsPref() {
        if (prefModal) prefModal.classList.add(`${APP_PREFIX}hide`);
        if (prefOverlay) prefOverlay.classList.add(`${APP_PREFIX}hide`);
    }

    function maybeShowVolumeStatsPref() {
        if (!isVolumeStatsPrefUnset()) return;
        if (helpModal && !helpModal.classList.contains(`${APP_PREFIX}hide`)) return;
        if (prefModal && !prefModal.classList.contains(`${APP_PREFIX}hide`)) return;
        openVolumeStatsPref();
    }

    function updateTotalChaptersDisplay(total) {
        if (!totalChaptersEl) return;
        totalChaptersEl.textContent = (total === null || typeof total === 'undefined') ? '...' : String(total);
    }

    function clearVolumeStatsUI() {
        state.volumeStatsData = null;
        updateTotalChaptersDisplay(null);
        document.querySelectorAll(`.${APP_PREFIX}volume-stats`).forEach(el => el.remove());
    }

    function normalizeVolumeName(text) {
        return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function buildWikidichParams(doc) {
        const html = doc.documentElement.outerHTML;
        const bookId =
            doc.querySelector('input#bookId')?.value ||
            doc.querySelector('input[name="bookId"]')?.value ||
            html.match(/var\s+bookId\s*=\s*"(.*?)"/)?.[1] ||
            null;
        const size = parseInt(html.match(/loadBookIndex\s*\(\s*0\s*,\s*(\d+)/)?.[1] || '50', 10);
        const signKey = html.match(/signKey\s*=\s*"(.*?)"/)?.[1] || null;
        const fuzzyMatch = html.match(/function\s+fuzzySign\s*\(\s*\w+\s*\)\s*\{([\s\S]*?)\}/);
        let shift = null;
        if (fuzzyMatch) {
            const body = fuzzyMatch[1];
            const rot = body.match(/text\.substring\(\s*(\d+)\s*\)\s*\+\s*text\.substring\(\s*0\s*,?\s*\1?\s*\)/);
            if (rot) shift = parseInt(rot[1], 10);
        }
        const fuzzy = (shift === null || Number.isNaN(shift)) ? null : (text) => text.substring(shift) + text.substring(0, shift);
        return { bookId, size, signKey, fuzzy };
    }

    async function sha256Hex(text) {
        if (!window.crypto || !window.crypto.subtle) return null;
        const data = new TextEncoder().encode(text);
        const hash = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function fetchHtml(url) {
        const res = await fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    }

    function toDoc(html) {
        return new DOMParser().parseFromString(html, 'text/html');
    }

    function buildIndexUrl({ bookId, signKey, sign, size, start }) {
        const params = new URLSearchParams({
            bookId,
            signKey,
            sign,
            size: String(size),
            start: String(start),
        });
        return `${location.origin}/book/index?${params.toString()}`;
    }

    function parseBookIndexPage(html) {
        const doc = toDoc(html);
        const volumes = [];
        const headers = Array.from(doc.querySelectorAll('h5.volume-name'));
        headers.forEach((h5) => {
            const name = h5.textContent.trim();
            const col = h5.closest('.col');
            let listCol = col ? col.nextElementSibling : null;
            if (!listCol || !listCol.querySelector('li.chapter-name')) {
                listCol = h5.parentElement?.parentElement?.querySelector('ul');
            }
            const anchors = listCol ? Array.from(listCol.querySelectorAll('li.chapter-name a')) : [];
            const titles = anchors.map(a => a.textContent.trim()).filter(Boolean);
            volumes.push({
                name,
                count: titles.length,
                lastTitle: titles.length ? titles[titles.length - 1] : '',
            });
        });
        const pageCount = doc.querySelectorAll('li.chapter-name a').length;
        const starts = Array.from(doc.querySelectorAll('ul.pagination a[data-start]'))
            .map(a => parseInt(a.getAttribute('data-start') || '0', 10))
            .filter(n => !Number.isNaN(n));
        const maxStart = starts.length ? Math.max(...starts) : 0;
        return { volumes, pageCount, maxStart };
    }

    async function fetchVolumeStats() {
        if (!state.isEditPage) return null;
        let params = buildWikidichParams(document);
        let detailDoc = null;
        const needOwner = !state.bookOwner;
        if (!params.signKey || !params.bookId || (state.volumeStatsEnabled && needOwner)) {
            const detailUrl = location.origin + location.pathname.replace(/\/chinh-sua$/, '');
            try {
                const html = await fetchHtml(detailUrl);
                detailDoc = toDoc(html);
                params = { ...params, ...buildWikidichParams(detailDoc) };
            } catch (e) {
                log(`❌ Không tải được trang thông tin truyện: ${e.message}`, 'error');
                return null;
            }
        }
        if (detailDoc) {
            const owner = parseBookOwnerFromDoc(detailDoc);
            if (owner) state.bookOwner = owner;
        }
        if (!params.bookId || !params.signKey) {
            log('⚠️ Thiếu bookId hoặc signKey để lấy mục lục.', 'warn');
            return null;
        }
        const size = params.size || 50;
        const volumes = [];
        const volumeIndex = new Map();
        let total = 0;
        let start = 0;
        let maxStart = 0;
        let guard = 0;
        while (guard < 200) {
            const base = `${params.signKey}${start}${size}`;
            const fuzzed = typeof params.fuzzy === 'function' ? params.fuzzy(base) : base;
            const sign = await sha256Hex(fuzzed);
            if (!sign) {
                log('❌ Trình duyệt không hỗ trợ SHA-256 để lấy mục lục.', 'error');
                break;
            }
            const url = buildIndexUrl({ bookId: params.bookId, signKey: params.signKey, sign, size, start });
            let html = '';
            try {
                html = await fetchHtml(url);
            } catch (e) {
                log(`❌ Lỗi tải mục lục: ${e.message}`, 'error');
                break;
            }
            const page = parseBookIndexPage(html);
            total += page.pageCount;
            maxStart = Math.max(maxStart, page.maxStart);
            page.volumes.forEach((vol) => {
                const key = normalizeVolumeName(vol.name);
                let idx = volumeIndex.get(key);
                if (idx === undefined) {
                    idx = volumes.length;
                    volumeIndex.set(key, idx);
                    volumes.push({ name: vol.name, count: 0, lastTitle: '' });
                }
                volumes[idx].count += vol.count;
                if (vol.lastTitle) volumes[idx].lastTitle = vol.lastTitle;
            });
            if (start >= maxStart) break;
            start += size;
            guard += 1;
        }
        return { total, volumes };
    }

    function injectVolumeStatsToPage(stats) {
        if (!stats || !Array.isArray(stats.volumes)) return;
        const wrappers = Array.from(document.querySelectorAll('.volume-info-wrapper'))
            .filter(w => !w.closest('#volumeWrapperSample'));
        stats.volumes.forEach((vol, idx) => {
            const wrapper = wrappers[idx];
            if (!wrapper) return;
            let statsEl = wrapper.querySelector(`.${APP_PREFIX}volume-stats`);
            if (!statsEl) {
                statsEl = document.createElement('div');
                statsEl.className = `${APP_PREFIX}volume-stats`;
                const desc = wrapper.querySelector('.volume-name-desc');
                if (desc && desc.parentNode) {
                    desc.parentNode.insertBefore(statsEl, desc.nextSibling);
                } else {
                    const info = wrapper.querySelector('.volume-info') || wrapper;
                    info.appendChild(statsEl);
                }
            }
            const lastTitle = vol.lastTitle ? escapeHtml(vol.lastTitle) : '...';
            statsEl.innerHTML = `Chương: <b>${vol.count}</b> • Cuối: <b>${lastTitle}</b>`;
        });
    }

    async function loadVolumeStats(force) {
        if (!state.isEditPage) return;
        if (!state.volumeStatsEnabled && !force) return;
        if (state.volumeStatsData && !force) {
            updateTotalChaptersDisplay(state.volumeStatsData.total);
            injectVolumeStatsToPage(state.volumeStatsData);
            return;
        }
        updateTotalChaptersDisplay('...');
        const stats = await fetchVolumeStats();
        if (!stats) return;
        state.volumeStatsData = stats;
        updateTotalChaptersDisplay(stats.total);
        injectVolumeStatsToPage(stats);
    }

    function ensureSelectedVolumeValid() {
        if (!state.selectedVolumeWrapper || !document.contains(state.selectedVolumeWrapper)) {
            state.selectedVolumeWrapper = null;
            uploadBtn.disabled = true;
            if (deleteVolumeBtn) deleteVolumeBtn.disabled = true;
            log('⚠️ Quyển đã bị xóa/đổi. Vui lòng chọn lại quyển.', 'warn');
            rebuildVolumeOptions('none');
            return false;
        }
        const selectedOption = volumeSelect.options[volumeSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.cannotModify === 'true') {
            log('⛔ Quyển này không thể bổ sung/chỉnh. Chỉ dùng Add New hoặc Xóa.', 'warn');
            return false;
        }
        return true;
    }

    function addNewVolumeAndSelect() {
        if (!state.isNewBookPage && !state.isEditPage) {
            log('⚠️ Thêm quyển chỉ dùng ở trang Nhúng file hoặc Chỉnh sửa.', 'warn');
            return;
        }
        const addBtn = document.querySelector('.btn-add-volume[data-action="addVolumeWrapper"]');
        if (!addBtn) {
            log('❌ Không tìm thấy nút "Thêm quyển" trên web.', 'error');
            return;
        }
        addBtn.click();
        setTimeout(() => {
            rebuildVolumeOptions('none');
            const wrappers = [...document.querySelectorAll('.volume-info-wrapper')];
            if (wrappers.length <= 1) {
                log('❌ Không tìm thấy quyển mới sau khi thêm.', 'error');
                return;
            }
            const lastRealIndex = wrappers.length - 2;
            const option = volumeSelect.options[lastRealIndex + 1];
            if (option && !option.disabled) {
                volumeSelect.value = String(lastRealIndex);
                handleVolumeChange();
                log('✅ Đã thêm và chọn quyển mới.', 'success');
                return;
            }
            rebuildVolumeOptions('lastAppendable');
            log('✅ Đã thêm quyển mới. Hãy chọn lại nếu cần.', 'success');
        }, 250);
    }



    const welcomeHtml = `
<div class="${APP_PREFIX}welcome-title" style="text-align:center; font-size:18px; font-weight:700;">
  🌸 Chào mừng đến với Auto Volume/Chapter Uploader 🌸
</div>
<div class="${APP_PREFIX}welcome-sub" style="text-align:center; margin:6px 0 10px 0;">
  Bộ trợ thủ giúp upload chương nhanh, gọn, chuẩn!
</div>
<div class="${APP_PREFIX}welcome-banner" style="background:linear-gradient(135deg,#fce4ec,#e3f2fd); padding:10px; border-radius:10px; border-left:4px solid #ec407a;">
  <strong>✨ WELCOME:</strong> Kéo thả panel, bấm ✕ để thu nhỏ, bấm icon tròn để mở lại.
</div>
<div style="height:8px;"></div>
    `.trim();

    const guideMarkdown = `
### 🌟 Luồng thao tác cơ bản
- Mở trang nhúng file hoặc chỉnh sửa truyện.
- **Chọn Quyển** cần bổ sung/chỉnh.
- Bấm **Files TXT** và chọn nhiều file.
- Script tự sắp xếp, kiểm tra, rồi điền tên chương + file.
- Bấm **Tải lên (web)** để nhấn nút upload thật.
- Nút **Xóa** dùng để xóa quyển đang chọn (Nhúng file hoặc Chỉnh sửa). Ở Chỉnh sửa, quyển **bổ sung** hoặc **không thể bổ sung** cần nhập **username chủ truyện** để xác nhận.
- Nút **Thêm Quyển** để tạo quyển mới và tự chọn vào đó.

### 🚦 Cảnh báo file nhỏ
- Nếu file < ngưỡng KB sẽ cảnh báo trước khi tiếp tục.
- Có thể đặt ngưỡng = 0 để tắt cảnh báo.

### 🧩 Chế độ "File tên số, dùng dòng đầu"
- Dùng cho file kiểu: 000.txt, 001.txt...
- Script **không parse số chương**, chỉ sắp xếp theo tên file.
- **Dòng đầu** của file sẽ được dùng làm **tên chương**.
- Không check trùng/thiếu chương và không điền mô tả bổ sung.

### 🧠 Parse chương (mặc định)
- **Ưu tiên lấy thông tin từ**:
  - Tên file (fallback dòng đầu) hoặc Dòng đầu (fallback tên file).
- Script dùng regex mặc định (tham chiếu logic app rename), không cần tự nhập regex.
- Mẫu tên chương: \`第{num}章 {title}\`.

### 🧯 Khi có lỗi parse
- Script sẽ liệt kê file lỗi và cho phép chèn thủ công.
- Bạn có thể **tiếp tục** hoặc **hủy** nếu thấy không ổn.

### 🍃 Tips nhỏ
- Script tự nhận diện bảng mã và có thể chuyển file về UTF-8 khi cần.
- Nếu thiếu nút upload, thử reload trang.
- Có thể bật thống kê chương theo quyển trong Cài đặt để xem tổng số chương.
    `.trim();

    const changelogMarkdown = `
### ✨ v1.2.6
- Thêm **💾 Lưu** + **🗂 Bản lưu**, lưu/khôi phục form nhúng truyện + volume/chapter + file (best-effort).
- Lưu file bản lưu lên khoảng **10MB/bản lưu** bằng **IndexedDB** (phụ thuộc quota trình duyệt).
- Mỗi thẻ bản lưu hiển thị **File: X/10MB** và khi xóa bản lưu sẽ dọn luôn file blob tránh rác.
- Cover dạng "blob:..." hoặc "data:image/...;base64,..." sẽ được lưu best-effort (ưu tiên IndexedDB).
- Thêm bước quét/làm sạch ký tự ẩn zero-width (U+200B/U+200C/U+200D/U+2060/U+FEFF) trước upload để tránh lỗi dịch bị tách chữ bất thường.
- Thu gọn cụm nút trong modal Bản lưu (icon + toolbar) để đỡ chiếm chỗ.
- Tóm tắt changelog cũ gọn hơn (như Autofill).

### 📦 Các bản trước (tóm tắt)
- v1.2.5: Popup xử lý ký tự đặc biệt, emoji/icon (4-byte), hỏi chuẩn hóa dấu phẩy Nhật "、", cải thiện dialog log.
- v1.2.4: Bỏ regex tùy chỉnh UI, auto-detect encoding + hỏi chuyển UTF-8, fix double số chương trong tiêu đề.
- v1.2.3: Tối ưu UI + theme tối.
- v1.2.2: Thống kê chương theo quyển, tổng chương trong cài đặt, luồng xóa quyển có xác nhận chủ truyện.
- v1.2.1: Hotfix gán file thật vào input + ổn định upload nhiều chương.
- v1.2.0: Thêm nút xóa/thêm quyển, chống treo khi upload lại, làm mới panel.
`.trim();


    function openHelpModal(contentHtml) {
        helpContent.innerHTML = contentHtml || '';
        settingsOverlay.classList.remove(`${APP_PREFIX}hide`);
        helpModal.classList.remove(`${APP_PREFIX}hide`);
    }

    function openHelpModalFull() {
        const html = [
            welcomeHtml,
            renderHelpMarkdown(guideMarkdown),
            '<div style="height:8px;"></div>',
            renderHelpMarkdown(changelogMarkdown)
        ].join('\n');
        openHelpModal(html);
    }

    function openHelpModalUpdateOnly() {
        const updateBanner = `
<div id="${APP_PREFIX}update-banner">
  <div style="font-size:15px;font-weight:700;">🌈 Bản cập nhật mới đã sẵn sàng!</div>
  <div style="font-size:12px;color:#6a4f7a;">Tóm tắt thay đổi quan trọng ở bên dưới ✨</div>
</div>
        `.trim();
        openHelpModal([updateBanner, renderHelpMarkdown(changelogMarkdown)].join('\n'));
    }

    function closeHelpModal() {
        helpModal.classList.add(`${APP_PREFIX}hide`);
        settingsOverlay.classList.add(`${APP_PREFIX}hide`);
        maybeShowThemePref();
    }

    const dialogState = {
        resolver: null,
        onKeyDown: null
    };

    function closeUiDialog(result = 'dismiss') {
        if (dialogState.onKeyDown) {
            window.removeEventListener('keydown', dialogState.onKeyDown);
            dialogState.onKeyDown = null;
        }
        if (dialogModal) dialogModal.classList.add(`${APP_PREFIX}hide`);
        if (dialogOverlay) dialogOverlay.classList.add(`${APP_PREFIX}hide`);
        const resolver = dialogState.resolver;
        dialogState.resolver = null;
        if (resolver) resolver(result);
    }

    function showUiDialog({
        title = 'Thông báo',
        message = '',
        confirmText = 'Đồng ý',
        cancelText = 'Hủy',
        showCancel = false,
        danger = false,
        extraText = '',
        extraDanger = false
    } = {}) {
        return new Promise((resolve) => {
            if (!dialogOverlay || !dialogModal || !dialogTitle || !dialogMessage || !dialogCancelBtn || !dialogOkBtn || !dialogExtraBtn) {
                resolve(showCancel ? 'dismiss' : 'ok');
                return;
            }

            if (dialogState.resolver) {
                closeUiDialog('dismiss');
            }

            dialogState.resolver = resolve;
            dialogTitle.textContent = String(title || 'Thông báo');
            dialogMessage.textContent = String(message || '');
            dialogOkBtn.textContent = String(confirmText || 'Đồng ý');
            dialogCancelBtn.textContent = String(cancelText || 'Hủy');
            dialogExtraBtn.textContent = String(extraText || '');
            dialogCancelBtn.classList.toggle(`${APP_PREFIX}hide`, !showCancel);
            dialogExtraBtn.classList.toggle(`${APP_PREFIX}hide`, !extraText);
            dialogOkBtn.classList.toggle(`${APP_PREFIX}btn-danger`, !!danger);
            dialogOkBtn.classList.toggle(`${APP_PREFIX}btn-secondary`, !danger);
            dialogExtraBtn.classList.toggle(`${APP_PREFIX}btn-danger`, !!extraDanger);
            dialogExtraBtn.classList.toggle(`${APP_PREFIX}btn-secondary`, !extraDanger);
            dialogExtraBtn.classList.toggle(`${APP_PREFIX}btn-ghost`, !extraDanger);

            dialogOverlay.classList.remove(`${APP_PREFIX}hide`);
            dialogModal.classList.remove(`${APP_PREFIX}hide`);

            dialogCancelBtn.onclick = () => closeUiDialog('cancel');
            dialogOkBtn.onclick = () => closeUiDialog('ok');
            dialogExtraBtn.onclick = () => closeUiDialog('extra');
            dialogOverlay.onclick = (ev) => {
                ev.preventDefault();
            };
            dialogState.onKeyDown = (ev) => {
                if (ev.key === 'Escape') {
                    ev.preventDefault();
                } else if (ev.key === 'Enter') {
                    ev.preventDefault();
                    closeUiDialog('ok');
                }
            };
            window.addEventListener('keydown', dialogState.onKeyDown);
        });
    }

    async function showUiAlert(message, title = 'Thông báo') {
        await showUiDialog({
            title,
            message,
            confirmText: 'OK',
            showCancel: false
        });
        return true;
    }

    async function showUiConfirm(message, title = 'Xác nhận', confirmText = 'Đồng ý', cancelText = 'Hủy', danger = false) {
        const result = await showUiDialog({
            title,
            message,
            confirmText,
            cancelText,
            showCancel: true,
            danger
        });
        return result === 'ok';
    }

    async function showUiThreeChoice(
        message,
        title = 'Chọn cách xử lý',
        textifyText = 'Đổi sang text (Khuyên dùng)',
        removeText = 'Xóa icon (An toàn)',
        keepText = 'Giữ nguyên (Dễ lỗi)'
    ) {
        const result = await showUiDialog({
            title,
            message,
            confirmText: textifyText,
            cancelText: removeText,
            showCancel: true,
            extraText: keepText,
            extraDanger: true
        });
        if (result === 'ok') return 'text';
        if (result === 'cancel') return 'remove';
        if (result === 'extra') return 'keep';
        if (result === 'dismiss') return 'text';
        return 'text';
    }

    function setParseControlsEnabled(enabled) {
        const fields = [
            prioritySelect,
            chapterTemplateInput
        ];
        fields.forEach((el) => {
            if (!el) return;
            el.disabled = !enabled;
            el.style.opacity = enabled ? '' : '0.6';
        });
    }

    // --- Chức năng Ghi log ---
    const log = (message, type = 'info') => {
        const now = new Date().toLocaleTimeString('vi-VN');
        const logEntry = document.createElement('div');
        logEntry.className = `${APP_PREFIX}log-entry ${APP_PREFIX}log-${type}`;
        logEntry.innerHTML = `<span class="${APP_PREFIX}log-time">[${now}]</span> ${message}`;
        logBox.appendChild(logEntry);

        while (logBox.children.length > settings.LOG_MAX_LINES) {
            logBox.removeChild(logBox.firstElementChild);
        }
        logBox.scrollTop = logBox.scrollHeight;

        if (type === 'error') console.error(`[Uploader] ${message}`);
        else if (type === 'warn') console.warn(`[Uploader] ${message}`);
        else console.log(`[Uploader] ${message}`);
    };
    let uploadToastTimer = null;
    const hideUploadToast = () => {
        if (!uploadToastEl) return;
        uploadToastEl.classList.remove('enter');
        uploadToastEl.classList.add('exit');
    };
    const showUploadToast = (message, stateName = 'loading', autoHideMs = 0) => {
        if (!uploadToastEl) return;
        if (uploadToastTimer) {
            clearTimeout(uploadToastTimer);
            uploadToastTimer = null;
        }
        uploadToastEl.textContent = message || '';
        uploadToastEl.setAttribute('data-state', stateName || 'loading');
        uploadToastEl.classList.remove('exit');
        void uploadToastEl.offsetWidth;
        uploadToastEl.classList.add('enter');
        if (autoHideMs > 0) {
            uploadToastTimer = setTimeout(() => {
                hideUploadToast();
                uploadToastTimer = null;
            }, autoHideMs);
        }
    };

    function installFormDataPatch() {
        const script = document.createElement('script');
        script.textContent = `
(function () {
  if (window.__WDU_FORMDATA_PATCHED) return;
  window.__WDU_FORMDATA_PATCHED = true;
  var origAppend = FormData.prototype.append;
  FormData.prototype.append = function (name, value, filename) {
    if (name === 'noteCn') {
      try {
        var text = (value == null) ? '' : String(value).trim();
        if (text && !this.__wdu_desc_added) {
          origAppend.call(this, 'descCn', value);
          this.__wdu_desc_added = true;
        }
      } catch (e) {}
    }
    return origAppend.apply(this, arguments);
  };
})();
        `;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }

    function setInputValue(input, value) {
        if (!input) return false;
        input.value = value == null ? '' : String(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    function syncAppendDesc(wrapper, text) {
        if (!wrapper || !text) return false;
        let updated = false;
        const descCnInput = wrapper.querySelector('.append-last-volume input[name="descCn"]');
        if (descCnInput) {
            setInputValue(descCnInput, text);
            updated = true;
        }
        const form = wrapper.querySelector('form.form-volume-info');
        if (form) {
            let noteCnInput = form.querySelector('input[name="noteCn"]');
            if (!noteCnInput) {
                noteCnInput = document.createElement('input');
                noteCnInput.type = 'hidden';
                noteCnInput.name = 'noteCn';
                form.appendChild(noteCnInput);
            }
            setInputValue(noteCnInput, text);
            updated = true;
        }
        return updated;
    }

    function computeDescInfo() {
        const items = (state.previewOrder && state.previewOrder.length > 0) ? state.previewOrder : state.validFiles;
        const nums = [];
        for (const item of items || []) {
            const num = item && item.chapterNumber;
            if (typeof num === 'number' && !Number.isNaN(num)) nums.push(num);
        }
        if (nums.length > 0) {
            nums.sort((a, b) => a - b);
            return { text: `${nums[0]}-${nums[nums.length - 1]}`, guessed: false };
        }
        if (state.invalidFiles.length > 0 && state.validFiles.length === 0) {
            const firstInvalidFile = state.invalidFiles[0].file || state.invalidFiles[0];
            const firstInvalidMatch = firstInvalidFile && firstInvalidFile.name ? firstInvalidFile.name.match(/\d+/) : null;
            if (firstInvalidMatch) {
                return { text: `Từ ${firstInvalidMatch[0]}`, guessed: true };
            }
        }
        return { text: '', guessed: false };
    }

    // --- Snapshot (Lưu/Bản lưu) ---
    const createSnapshotId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const sleepMs = (ms) => new Promise(r => setTimeout(r, ms));
    const safeJsonParse = (raw, fallback) => {
        try { return JSON.parse(raw); } catch { return fallback; }
    };
    const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        const chunk = 0x8000;
        let binary = '';
        for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(binary);
    };
    const base64ToUint8Array = (b64) => {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
        return bytes;
    };
    const formatDateTime = (ts) => {
        try {
            return new Date(ts).toLocaleString('vi-VN');
        } catch {
            return String(ts || '');
        }
    };
    const formatMB = (bytes) => {
        const n = typeof bytes === 'number' && !Number.isNaN(bytes) ? bytes : 0;
        return (n / (1024 * 1024)).toFixed(2);
    };
    const mimeToExt = (mime) => {
        const m = String(mime || '').toLowerCase();
        if (m.includes('png')) return 'png';
        if (m.includes('webp')) return 'webp';
        if (m.includes('gif')) return 'gif';
        if (m.includes('bmp')) return 'bmp';
        if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
        return 'bin';
    };
    const getCoverFileInput = () => {
        return document.querySelector('input[type="file"][data-change="changeCoverFile"]')
            || document.querySelector('input[type="file"][name="cover"]')
            || null;
    };
    const setFileToInput = (inputEl, fileObj) => {
        if (!inputEl || !fileObj) return false;
        try {
            const dt = new DataTransfer();
            dt.items.add(fileObj);
            inputEl.files = dt.files;
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        } catch {
            return false;
        }
    };

    // IndexedDB helpers (store file blobs by snapshot id)
    let snapshotDbPromise = null;
    const openSnapshotDb = () => {
        if (snapshotDbPromise) return snapshotDbPromise;
        snapshotDbPromise = new Promise((resolve, reject) => {
            try {
                if (!('indexedDB' in window)) {
                    resolve(null);
                    return;
                }
                const req = indexedDB.open(SNAPSHOT_DB_NAME, 1);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(SNAPSHOT_DB_STORE)) {
                        const store = db.createObjectStore(SNAPSHOT_DB_STORE, { keyPath: 'key' });
                        store.createIndex('snapshotId', 'snapshotId', { unique: false });
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
            } catch (e) {
                resolve(null);
            }
        });
        return snapshotDbPromise;
    };
    const idbPutSnapshotFile = async (record) => {
        const db = await openSnapshotDb();
        if (!db) return false;
        return await new Promise((resolve) => {
            try {
                const tx = db.transaction(SNAPSHOT_DB_STORE, 'readwrite');
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
                tx.objectStore(SNAPSHOT_DB_STORE).put(record);
            } catch {
                resolve(false);
            }
        });
    };
    const idbGetSnapshotFile = async (key) => {
        const db = await openSnapshotDb();
        if (!db) return null;
        return await new Promise((resolve) => {
            try {
                const tx = db.transaction(SNAPSHOT_DB_STORE, 'readonly');
                const req = tx.objectStore(SNAPSHOT_DB_STORE).get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            } catch {
                resolve(null);
            }
        });
    };
    const idbDeleteSnapshotFilesBySnapshotId = async (snapshotId) => {
        const db = await openSnapshotDb();
        if (!db) return 0;
        return await new Promise((resolve) => {
            let deleted = 0;
            try {
                const tx = db.transaction(SNAPSHOT_DB_STORE, 'readwrite');
                const store = tx.objectStore(SNAPSHOT_DB_STORE);
                const index = store.index('snapshotId');
                const range = IDBKeyRange.only(snapshotId);
                const req = index.openCursor(range);
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) return;
                    try {
                        cursor.delete();
                        deleted += 1;
                    } catch { }
                    cursor.continue();
                };
                tx.oncomplete = () => resolve(deleted);
                tx.onerror = () => resolve(deleted);
            } catch {
                resolve(deleted);
            }
        });
    };
    const loadSnapshots = () => {
        const raw = GM_getValue(SNAPSHOTS_KEY, '[]');
        const list = Array.isArray(raw) ? raw : safeJsonParse(String(raw || '[]'), []);
        return Array.isArray(list) ? list : [];
    };
    const saveSnapshots = (list) => {
        const next = Array.isArray(list) ? list : [];
        GM_setValue(SNAPSHOTS_KEY, next);
    };
    const getWebBookMeta = () => {
        const readById = (id) => normalizeText(document.getElementById(id)?.value || '');
        const pickFirst = (arr) => arr.find(Boolean) || '';
        const titleVi = pickFirst([readById('txtTitleVi'), readById('titleVi'), readById('txtNameVi')]);
        const authorVi = pickFirst([readById('txtAuthorVi'), readById('authorVi')]);
        const titleCn = pickFirst([readById('txtTitleCn'), readById('titleCn'), readById('txtNameCn')]);
        const authorCn = pickFirst([readById('txtAuthorCn'), readById('authorCn'), readById('txtAuthor')]);
        const title = titleVi || titleCn || normalizeText(document.title) || '(Chưa có tên)';
        const author = authorVi || authorCn || '(Chưa có tác giả)';
        return { title, author, titleVi, authorVi, titleCn, authorCn };
    };
    const collectKnownFilesByName = () => {
        const map = new Map();
        const add = (file) => {
            if (!file || !file.name) return;
            if (!map.has(file.name)) map.set(file.name, file);
        };
        (state.allFiles || []).forEach(add);
        (state.validFiles || []).forEach(item => add(item?.file));
        (state.invalidFiles || []).forEach(item => add(item?.file || item));
        (state.previewOrder || []).forEach(item => add(item?.file));
        return map;
    };

    const scanAutofillFormState = () => {
        // Same selectors as Wikidich Autofill script uses.
        const readById = (id) => normalizeText(document.getElementById(id)?.value || '');
        // IMPORTANT: do NOT normalize data URLs (base64) or we may break decoding.
        const coverFromImg = String(document.getElementById('imgCover')?.getAttribute('src') || '').trim();
        const coverInput = readById('imgUrl');
        const moreLinkDesc = normalizeText(document.querySelector('input[name="moreLinkDesc"]')?.value || '');
        const moreLinkUrl = normalizeText(document.querySelector('input[name="moreLinkUrl"]')?.value || '');

        const keysRadio = ['status', 'official', 'gender'];
        const keysCheck = ['age', 'ending', 'genre', 'tag'];

        const allInputs = Array.from(document.querySelectorAll('.book-attr-group input[name]'));
        if (!allInputs.length) {
            return {
                titleCn: readById('txtTitleCn'),
                authorCn: readById('txtAuthorCn'),
                titleVi: readById('txtTitleVi'),
                descVi: String(document.getElementById('txtDescVi')?.value || '').trim(),
                coverUrl: coverInput || '',
                cover: {
                    url: coverInput || '',
                    dataUrl: coverFromImg || '',
                    store: null,
                    key: null,
                    bytes: 0,
                    type: '',
                },
                groups: {},
                moreLink: { desc: moreLinkDesc, url: moreLinkUrl },
            };
        }

        const getLabelFor = (input) => {
            if (!input || !input.id) return '';
            const labelEl = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
            return normalizeText(labelEl?.textContent || '');
        };

        const groups = {};
        keysRadio.forEach((name) => {
            const inputs = allInputs.filter(i => i.getAttribute('name') === name && (i.type || '').toLowerCase() === 'radio');
            const checked = inputs.find(i => i.checked);
            groups[name] = {
                type: 'radio',
                value: checked ? normalizeText(checked.value || '') : '',
                label: checked ? getLabelFor(checked) : '',
            };
        });
        keysCheck.forEach((name) => {
            const inputs = allInputs.filter(i => i.getAttribute('name') === name && (i.type || '').toLowerCase() === 'checkbox');
            const checked = inputs.filter(i => i.checked);
            groups[name] = {
                type: 'checkbox',
                items: checked.map(i => ({
                    value: normalizeText(i.value || ''),
                    label: getLabelFor(i),
                })),
            };
        });

        return {
            titleCn: readById('txtTitleCn'),
            authorCn: readById('txtAuthorCn'),
            titleVi: readById('txtTitleVi'),
            descVi: String(document.getElementById('txtDescVi')?.value || '').trim(),
            coverUrl: coverInput || '',
            cover: {
                url: coverInput || '',
                dataUrl: coverFromImg || '',
                store: null,
                key: null,
                bytes: 0,
                type: '',
            },
            groups,
            moreLink: { desc: moreLinkDesc, url: moreLinkUrl },
        };
    };

    const applyAutofillFormState = async (formState) => {
        if (!formState || typeof formState !== 'object') return;

        const setId = (id, value) => {
            const el = document.getElementById(id);
            if (!el) return false;
            return setInputValue(el, value == null ? '' : String(value));
        };

        setId('txtTitleCn', formState.titleCn || '');
        setId('txtAuthorCn', formState.authorCn || '');
        setId('txtTitleVi', formState.titleVi || '');
        setId('txtDescVi', formState.descVi || '');
        const coverUrl = normalizeText(formState.coverUrl || formState.cover?.url || '');
        if (coverUrl) {
            if (/^data:image\//i.test(coverUrl)) {
                const img = document.getElementById('imgCover');
                if (img) img.setAttribute('src', coverUrl);
                // Try to also set cover file input so the web can actually upload it.
                const m = coverUrl.match(/^data:([^;]+);base64,(.*)$/i);
                if (m) {
                    const type = m[1] || 'image/jpeg';
                    const b64 = (m[2] || '').replace(/\s+/g, '');
                    try {
                        const bytes = base64ToUint8Array(b64);
                        const blob = new Blob([bytes], { type });
                        const ext = mimeToExt(type);
                        const file = new File([blob], `cover.${ext}`, { type, lastModified: Date.now() });
                        const fileInput = getCoverFileInput();
                        if (fileInput) setFileToInput(fileInput, file);
                    } catch { }
                }
            } else {
                setId('imgUrl', coverUrl);
            }
        } else if (formState.cover && formState.cover.store === 'idb' && formState.cover.key) {
            const rec = await idbGetSnapshotFile(formState.cover.key);
            const img = document.getElementById('imgCover');
            if (img && rec && rec.blob) {
                try {
                    const objectUrl = URL.createObjectURL(rec.blob);
                    img.setAttribute('src', objectUrl);
                } catch { }
            }
            if (rec && rec.blob) {
                const type = rec.type || rec.blob.type || 'image/jpeg';
                const ext = mimeToExt(type);
                try {
                    const file = new File([rec.blob], `cover.${ext}`, { type, lastModified: rec.lastModified || Date.now() });
                    const fileInput = getCoverFileInput();
                    if (fileInput) setFileToInput(fileInput, file);
                } catch { }
            }
        } else if (formState.cover && formState.cover.store === 'inline' && formState.cover.dataUrl) {
            const img = document.getElementById('imgCover');
            if (img) img.setAttribute('src', String(formState.cover.dataUrl));
            const m = String(formState.cover.dataUrl).match(/^data:([^;]+);base64,(.*)$/i);
            if (m) {
                const type = m[1] || 'image/jpeg';
                const b64 = (m[2] || '').replace(/\s+/g, '');
                try {
                    const bytes = base64ToUint8Array(b64);
                    const blob = new Blob([bytes], { type });
                    const ext = mimeToExt(type);
                    const file = new File([blob], `cover.${ext}`, { type, lastModified: Date.now() });
                    const fileInput = getCoverFileInput();
                    if (fileInput) setFileToInput(fileInput, file);
                } catch { }
            }
        }

        // More links: only first row like Autofill currently uses.
        const moreDescEl = document.querySelector('input[name="moreLinkDesc"]');
        const moreUrlEl = document.querySelector('input[name="moreLinkUrl"]');
        if (moreDescEl) setInputValue(moreDescEl, formState.moreLink?.desc || '');
        if (moreUrlEl) setInputValue(moreUrlEl, formState.moreLink?.url || '');

        const allInputs = Array.from(document.querySelectorAll('.book-attr-group input[name]'));
        if (!allInputs.length) return;

        const getLabelFor = (input) => {
            if (!input || !input.id) return '';
            const labelEl = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
            return normalizeText(labelEl?.textContent || '');
        };
        const clickToSet = (input, wantChecked) => {
            if (!input) return;
            const current = !!input.checked;
            if (current === !!wantChecked) return;
            try { input.click(); } catch { input.checked = !!wantChecked; }
            input.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const groups = formState.groups && typeof formState.groups === 'object' ? formState.groups : {};
        Object.keys(groups).forEach((name) => {
            const g = groups[name];
            if (!g || typeof g !== 'object') return;

            if (g.type === 'radio') {
                const inputs = allInputs.filter(i => i.getAttribute('name') === name && (i.type || '').toLowerCase() === 'radio');
                const target = inputs.find(i => normalizeText(i.value || '') === normalizeText(g.value || ''))
                    || inputs.find(i => normalizeText(getLabelFor(i)).toLowerCase() === normalizeText(g.label || '').toLowerCase());
                if (target) clickToSet(target, true);
                return;
            }

            if (g.type === 'checkbox') {
                const inputs = allInputs.filter(i => i.getAttribute('name') === name && (i.type || '').toLowerCase() === 'checkbox');
                const wanted = Array.isArray(g.items) ? g.items : [];
                const wantedValues = new Set(wanted.map(it => normalizeText(it?.value || '')).filter(Boolean));
                const wantedLabels = new Set(wanted.map(it => normalizeText(it?.label || '').toLowerCase()).filter(Boolean));
                inputs.forEach((input) => {
                    const v = normalizeText(input.value || '');
                    const l = normalizeText(getLabelFor(input)).toLowerCase();
                    const want = (v && wantedValues.has(v)) || (l && wantedLabels.has(l));
                    clickToSet(input, want);
                });
            }
        });

        if (window.M && typeof window.M.updateTextFields === 'function') {
            try { window.M.updateTextFields(); } catch { }
        }
        await sleepMs(0);
    };

    const scanWebState = async () => {
        const snapshotId = createSnapshotId();
        const book = getWebBookMeta();
        const autofillForm = scanAutofillFormState();
        const wrappers = getRealVolumeWrappers();
        const selectedIndex = wrappers.indexOf(state.selectedVolumeWrapper);
        const volumes = [];
        let inlineUsed = 0;
        let savedFileBytes = 0;
        let savedFiles = 0;
        const tool = {
            useFirstLineOnly: !!(firstLineOnlyInput && firstLineOnlyInput.checked),
            chapTemplate: normalizeText(chapterTemplateInput?.value || settings.CHAPTER_NAME_TEMPLATE || ''),
            parsePriority: normalizeText(prioritySelect?.value || settings.PARSE_PRIORITY || ''),
        };

        // Store cover into IndexedDB (avoid bloating GM storage) when possible.
        if (autofillForm && autofillForm.cover && typeof autofillForm.cover === 'object') {
            const cover = autofillForm.cover;
            const url = normalizeText(cover.url || '');
            const dataUrl = String(cover.dataUrl || '').trim();
            const isDataImage = /^data:image\//i.test(dataUrl);
            const isBlobUrl = /^blob:/i.test(dataUrl);
            const isHttpUrl = /^https?:\/\//i.test(dataUrl);

            // If user pasted a real URL into img src, keep it as cover url.
            if (!url && isHttpUrl) {
                cover.url = dataUrl;
                autofillForm.coverUrl = dataUrl;
                cover.dataUrl = '';
            } else if (!url && isBlobUrl) {
                // Web often uses blob: URL for cover preview after picking a file.
                // Fetch it now (while the blob URL is alive) and store bytes.
                try {
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    const approxBytes = blob.size || 0;
                    let stored = false;
                    if (blob && (savedFileBytes + approxBytes) <= SNAPSHOT_MAX_FILE_BYTES) {
                        const type = blob.type || 'image/jpeg';
                        const key = `${snapshotId}::cover`;
                        const ok = await idbPutSnapshotFile({
                            key,
                            snapshotId,
                            kind: 'cover',
                            fileName: 'cover',
                            bytes: blob.size,
                            type,
                            lastModified: 0,
                            blob,
                        });
                        if (ok) {
                            cover.store = 'idb';
                            cover.key = key;
                            cover.bytes = blob.size;
                            cover.type = type;
                            cover.dataUrl = '';
                            savedFileBytes += blob.size;
                            stored = true;
                        }
                    }
                    if (!stored && blob && (inlineUsed + approxBytes) <= SNAPSHOT_MAX_INLINE_FILE_BYTES) {
                        const type = blob.type || 'image/jpeg';
                        const buf = await blob.arrayBuffer();
                        const b64 = arrayBufferToBase64(buf);
                        cover.store = 'inline';
                        cover.key = null;
                        cover.bytes = approxBytes;
                        cover.type = type;
                        cover.dataUrl = `data:${type};base64,${b64}`;
                        inlineUsed += approxBytes;
                        stored = true;
                    }
                    if (!stored) {
                        cover.store = null;
                        cover.key = null;
                        cover.bytes = 0;
                        cover.type = '';
                        cover.dataUrl = '';
                    }
                } catch {
                    cover.store = null;
                    cover.key = null;
                    cover.bytes = 0;
                    cover.type = '';
                    cover.dataUrl = '';
                }
            } else if (!url && isDataImage && (savedFileBytes < SNAPSHOT_MAX_FILE_BYTES)) {
                const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/i);
                if (m) {
                    const type = m[1] || 'image/jpeg';
                    const b64 = (m[2] || '').replace(/\s+/g, '');
                    const approxBytes = Math.floor((b64.length * 3) / 4);
                    let stored = false;
                    if ((savedFileBytes + approxBytes) <= SNAPSHOT_MAX_FILE_BYTES) {
                        try {
                            const bytes = base64ToUint8Array(b64);
                            const blob = new Blob([bytes], { type });
                            const key = `${snapshotId}::cover`;
                            const ok = await idbPutSnapshotFile({
                                key,
                                snapshotId,
                                kind: 'cover',
                                fileName: 'cover',
                                bytes: blob.size,
                                type,
                                lastModified: 0,
                                blob,
                            });
                            if (ok) {
                                cover.store = 'idb';
                                cover.key = key;
                                cover.bytes = blob.size;
                                cover.type = type;
                                cover.dataUrl = '';
                                savedFileBytes += blob.size;
                                stored = true;
                            }
                        } catch { }
                    }
                    if (!stored && (inlineUsed + approxBytes) <= SNAPSHOT_MAX_INLINE_FILE_BYTES) {
                        cover.store = 'inline';
                        cover.key = null;
                        cover.bytes = approxBytes;
                        cover.type = type;
                        cover.dataUrl = dataUrl;
                        inlineUsed += approxBytes;
                        stored = true;
                    }
                }
                // If not stored, avoid persisting huge strings.
                if (!cover.store) {
                    cover.store = null;
                    cover.key = null;
                    cover.bytes = 0;
                    cover.type = '';
                    cover.dataUrl = '';
                }
            } else {
                // If coverUrl exists, keep it; do not persist dataUrl.
                cover.dataUrl = '';
            }
        }

        for (let i = 0; i < wrappers.length; i += 1) {
            const wrapper = wrappers[i];
            const trueWrapper = wrapper.querySelector('.volume-wrapper');
            const nameInput = wrapper.querySelector('input[name="nameCn"], input[name="name"]');
            const volName = normalizeText(nameInput?.value || getVolumeDisplayName(wrapper, i));
            const appendable = !!(trueWrapper && trueWrapper.getAttribute('data-append') === 'true');
            const appendMode = normalizeText(trueWrapper?.querySelector('input[name="appendMode"]')?.value || '');
            const autoNumber = !!trueWrapper?.querySelector('input[name="autoNumber"]')?.checked;
            const numFile = normalizeText(trueWrapper?.querySelector('input[name="numFile"]')?.value || '');
            const chapterWrapper = trueWrapper?.querySelector('.chapter-wrapper');
            const rows = chapterWrapper ? Array.from(chapterWrapper.querySelectorAll('.chapter-info-wrapper')) : [];
            const chapters = [];

            for (let r = 0; r < rows.length; r += 1) {
                const row = rows[r];
                const chapterName = normalizeText(row.querySelector('input[name="name"]')?.value || '');
                const fileText = normalizeText(row.querySelector('input.file-path')?.value || '');
                const fileInputReal =
                    row.querySelector('input[type="file"][name="file"], input[name="file"][type="file"]') ||
                    row.querySelector('input[type="file"]');
                const fileObj = fileInputReal?.files && fileInputReal.files.length ? fileInputReal.files[0] : null;
                const fileName = normalizeText(fileObj?.name || fileText);

                const chapter = {
                    name: chapterName,
                    fileName,
                    fileInfo: fileObj ? {
                        name: fileObj.name,
                        size: fileObj.size,
                        type: fileObj.type || 'text/plain',
                        lastModified: fileObj.lastModified || 0,
                    } : null,
                    fileStore: null, // 'idb' | 'inline' | null
                    fileKey: null,
                    fileBase64: null, // legacy/fallback
                };

                // Best-effort store file blob into IndexedDB up to 10MB per snapshot.
                if (fileObj && (savedFileBytes + fileObj.size) <= SNAPSHOT_MAX_FILE_BYTES) {
                    const key = `${snapshotId}::${i}::${r}::${fileObj.name}::${fileObj.lastModified || 0}`;
                    const ok = await idbPutSnapshotFile({
                        key,
                        snapshotId,
                        fileName: fileObj.name,
                        bytes: fileObj.size,
                        type: fileObj.type || 'text/plain',
                        lastModified: fileObj.lastModified || 0,
                        blob: fileObj,
                    });
                    if (ok) {
                        chapter.fileStore = 'idb';
                        chapter.fileKey = key;
                        savedFileBytes += fileObj.size;
                        savedFiles += 1;
                    }
                }

                // Fallback: tiny inline base64 if IndexedDB is unavailable or over cap.
                if (!chapter.fileStore && fileObj && (inlineUsed + fileObj.size) <= SNAPSHOT_MAX_INLINE_FILE_BYTES) {
                    try {
                        const buf = await fileObj.arrayBuffer();
                        chapter.fileBase64 = arrayBufferToBase64(buf);
                        chapter.fileStore = 'inline';
                        inlineUsed += fileObj.size;
                    } catch { }
                }

                if (chapter.name || chapter.fileName) chapters.push(chapter);
            }

            volumes.push({
                index: i,
                name: volName,
                appendable,
                appendMode,
                autoNumber,
                numFile,
                chapters,
            });
        }

        return {
            id: snapshotId,
            createdAt: Date.now(),
            domain: location.hostname,
            pagePath: location.pathname,
            book,
            autofillForm,
            selectedVolumeIndex: selectedIndex,
            volumes,
            inlineFileBytes: inlineUsed,
            savedFileBytes,
            savedFiles,
            tool,
        };
    };

    const openSnapshotsModal = () => {
        if (!snapshotsOverlay || !snapshotsModal) return;
        snapshotsOverlay.classList.remove(`${APP_PREFIX}hide`);
        snapshotsModal.classList.remove(`${APP_PREFIX}hide`);
    };
    const closeSnapshotsModal = () => {
        if (snapshotsModal) snapshotsModal.classList.add(`${APP_PREFIX}hide`);
        if (snapshotsOverlay) snapshotsOverlay.classList.add(`${APP_PREFIX}hide`);
    };

    const snapshotsUi = {
        selected: new Set(),
        list: [],
    };
    const updateSnapshotsActions = () => {
        const n = snapshotsUi.selected.size;
        if (snapshotsDeleteBtn) snapshotsDeleteBtn.disabled = n === 0;
        if (snapshotsRestoreBtn) snapshotsRestoreBtn.disabled = n !== 1;
    };
    const toggleSnapshotSelected = (id, nextVal) => {
        const want = (typeof nextVal === 'boolean') ? nextVal : !snapshotsUi.selected.has(id);
        if (want) snapshotsUi.selected.add(id);
        else snapshotsUi.selected.delete(id);
        updateSnapshotsActions();
    };
    const renderSnapshotsList = () => {
        if (!snapshotsListEl) return;
        const list = loadSnapshots();
        snapshotsUi.list = list;
        const prev = snapshotsUi.selected instanceof Set ? snapshotsUi.selected : new Set();
        const validIds = new Set(list.map(s => s?.id).filter(Boolean));
        snapshotsUi.selected = new Set(Array.from(prev).filter(id => validIds.has(id)));
        updateSnapshotsActions();

        if (!list.length) {
            snapshotsListEl.innerHTML = `<div id="${APP_PREFIX}snapshots-empty">Chưa có bản lưu nào. Bấm 💾 Lưu để tạo bản lưu.</div>`;
            return;
        }

        snapshotsListEl.innerHTML = list.map((snap) => {
            const title = escapeHtml(`${snap?.book?.title || '(Chưa có tên)'} • ${snap?.book?.author || '(Chưa có tác giả)'}`);
            const when = escapeHtml(formatDateTime(snap.createdAt));
            const vcount = Array.isArray(snap.volumes) ? snap.volumes.length : 0;
            const selected = typeof snap.selectedVolumeIndex === 'number' && snap.selectedVolumeIndex >= 0 ? `Quyển: ${snap.selectedVolumeIndex + 1}` : 'Quyển: (chưa chọn)';
            const totalCh = Array.isArray(snap.volumes) ? snap.volumes.reduce((acc, v) => acc + ((v?.chapters?.length) || 0), 0) : 0;
            const savedBytes = (snap.savedFileBytes || 0) + (snap.inlineFileBytes || 0);
            const savedMb = formatMB(savedBytes);
            const capMb = formatMB(SNAPSHOT_MAX_FILE_BYTES);
            return `
                <div class="${APP_PREFIX}snapshots-card" data-id="${escapeHtml(snap.id)}" data-selected="false">
                    <input class="${APP_PREFIX}snapshots-check" type="checkbox" data-id="${escapeHtml(snap.id)}" />
                    <div class="${APP_PREFIX}snapshots-meta">
                        <div class="${APP_PREFIX}snapshots-title">${title}</div>
                        <div class="${APP_PREFIX}snapshots-sub">
                            <span>${when}</span>
                            <span>Volumes: ${vcount}</span>
                            <span>${escapeHtml(selected)}</span>
                            <span>Chương: ${totalCh}</span>
                            <span>File: ${savedMb}/${capMb} MB</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        snapshotsListEl.querySelectorAll(`.${APP_PREFIX}snapshots-card`).forEach((card) => {
            const id = card.getAttribute('data-id') || '';
            const checkbox = card.querySelector(`input.${APP_PREFIX}snapshots-check`);
            const applySelectedUi = () => {
                const sel = snapshotsUi.selected.has(id);
                card.setAttribute('data-selected', sel ? 'true' : 'false');
                if (checkbox) checkbox.checked = sel;
            };
            const toggle = () => {
                toggleSnapshotSelected(id);
                applySelectedUi();
            };
            card.addEventListener('click', (ev) => {
                if (ev.target && (ev.target.tagName || '').toLowerCase() === 'input') return;
                toggle();
            });
            if (checkbox) {
                checkbox.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                });
                checkbox.addEventListener('change', () => {
                    toggleSnapshotSelected(id, !!checkbox.checked);
                    applySelectedUi();
                });
            }
            applySelectedUi();
        });
    };

    const saveCurrentSnapshot = async () => {
        try {
            showUploadToast('Đang lưu trạng thái web...', 'loading');
            const snap = await scanWebState();
            const list = loadSnapshots();
            list.unshift(snap);
            if (list.length > SNAPSHOT_MAX_ITEMS) {
                const removed = list.splice(SNAPSHOT_MAX_ITEMS);
                // Cleanup old snapshot file blobs to avoid orphan data.
                for (const s of removed) {
                    const sid = s?.id;
                    if (sid) {
                        try { await idbDeleteSnapshotFilesBySnapshotId(sid); } catch { }
                    }
                }
            }
            saveSnapshots(list);
            const savedMb = formatMB((snap.savedFileBytes || 0) + (snap.inlineFileBytes || 0));
            const capMb = formatMB(SNAPSHOT_MAX_FILE_BYTES);
            log(`💾 Đã lưu trạng thái: ${escapeHtml(snap.book.title)} • ${escapeHtml(snap.book.author)} (file lưu ~${savedMb}/${capMb} MB).`, 'success');
            showUploadToast('Đã lưu trạng thái web.', 'success', 1800);
        } catch (e) {
            log(`❌ Lưu trạng thái thất bại: ${e.message}`, 'error');
            showUploadToast('Lưu trạng thái thất bại.', 'error', 2200);
        }
    };

    const restoreSnapshot = async (snap) => {
        if (!snap || !Array.isArray(snap.volumes)) return;
        showUploadToast('Đang khôi phục trạng thái...', 'loading');
        if (snap.tool && typeof snap.tool === 'object') {
            if (typeof snap.tool.useFirstLineOnly === 'boolean') {
                settings.USE_FIRST_LINE_ONLY = snap.tool.useFirstLineOnly;
                if (firstLineOnlyInput) firstLineOnlyInput.checked = snap.tool.useFirstLineOnly;
            }
            if (typeof snap.tool.chapTemplate === 'string' && snap.tool.chapTemplate.trim()) {
                settings.CHAPTER_NAME_TEMPLATE = snap.tool.chapTemplate.trim();
                if (chapterTemplateInput) chapterTemplateInput.value = settings.CHAPTER_NAME_TEMPLATE;
            }
            if (typeof snap.tool.parsePriority === 'string' && snap.tool.parsePriority.trim()) {
                settings.PARSE_PRIORITY = snap.tool.parsePriority.trim();
                if (prioritySelect) prioritySelect.value = settings.PARSE_PRIORITY;
            }
            saveSettings();
        }
        if (snap.autofillForm && typeof snap.autofillForm === 'object') {
            await applyAutofillFormState(snap.autofillForm);
        }

        const ensureVolumeCount = async (count) => {
            let wrappers = getRealVolumeWrappers();
            const addBtn = document.querySelector('.btn-add-volume[data-action="addVolumeWrapper"]');
            let guard = 0;
            while (wrappers.length < count && addBtn && guard < 50) {
                addBtn.click();
                await sleepMs(140);
                wrappers = getRealVolumeWrappers();
                guard += 1;
            }
            return wrappers;
        };

        const wrappers = await ensureVolumeCount(snap.volumes.length);
        const knownFiles = collectKnownFilesByName();
        let missingFiles = 0;

        const setFileToInput = (inputEl, fileObj) => {
            if (!inputEl || !fileObj) return false;
            try {
                const dt = new DataTransfer();
                dt.items.add(fileObj);
                inputEl.files = dt.files;
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            } catch {
                return false;
            }
        };

        const restoreVolume = async (wrapper, vState) => {
            const trueWrapper = wrapper?.querySelector('.volume-wrapper');
            if (!trueWrapper) return;
            const nameInput = wrapper.querySelector('input[name="nameCn"], input[name="name"]');
            if (nameInput && typeof vState.name === 'string') {
                setInputValue(nameInput, vState.name);
            }
            const appendModeInput = trueWrapper.querySelector('input[name="appendMode"]');
            if (appendModeInput && typeof vState.appendMode === 'string') {
                setInputValue(appendModeInput, vState.appendMode);
            }
            const autoNumberInput = trueWrapper.querySelector('input[name="autoNumber"]');
            if (autoNumberInput && typeof vState.autoNumber === 'boolean' && autoNumberInput.checked !== vState.autoNumber) {
                autoNumberInput.click();
            }

            const addChapterBtn = trueWrapper.querySelector('[data-action="addChapterInfo"]');
            const chapterWrapper = trueWrapper.querySelector('.chapter-wrapper');
            if (!addChapterBtn || !chapterWrapper) return;

            const desired = Array.isArray(vState.chapters) ? vState.chapters.length : 0;
            const rows = () => Array.from(chapterWrapper.querySelectorAll('.chapter-info-wrapper'));

            // Clear existing rows first.
            rows().forEach((row) => {
                const removeBtn = row.querySelector('[data-action="removeChapter"]');
                if (removeBtn) removeBtn.click();
                else row.remove();
            });
            await sleepMs(120);

            const numFileInput = trueWrapper.querySelector('input[name="numFile"]');
            const ensureRows = async () => {
                if (desired <= 0) return true;
                if (numFileInput) {
                    numFileInput.value = String(desired);
                    numFileInput.dispatchEvent(new Event('input', { bubbles: true }));
                    numFileInput.dispatchEvent(new Event('change', { bubbles: true }));
                    await sleepMs(120);
                }
                let current = rows().length;
                let guard = 0;
                while (current < desired && guard < desired + 10) {
                    addChapterBtn.click();
                    await sleepMs(10);
                    current = rows().length;
                    guard += 1;
                }
                return rows().length >= desired;
            };

            await ensureRows();
            const finalRows = rows();
            for (let i = 0; i < Math.min(desired, finalRows.length); i += 1) {
                const row = finalRows[i];
                const ch = vState.chapters[i] || {};
                const nameEl = row.querySelector('input[name="name"]');
                const fileTextInput = row.querySelector('input.file-path');
                const fileInputReal =
                    row.querySelector('input[type="file"][name="file"], input[name="file"][type="file"]') ||
                    row.querySelector('input[type="file"]');
                if (nameEl && typeof ch.name === 'string') {
                    setInputValue(nameEl, ch.name);
                }
                if (fileTextInput && typeof ch.fileName === 'string') {
                    setInputValue(fileTextInput, ch.fileName);
                }

                let fileObj = null;
                if (ch.fileStore === 'idb' && ch.fileKey) {
                    const rec = await idbGetSnapshotFile(ch.fileKey);
                    if (rec && rec.blob && rec.fileName) {
                        try {
                            fileObj = new File([rec.blob], rec.fileName, {
                                type: rec.type || 'text/plain',
                                lastModified: rec.lastModified || Date.now(),
                            });
                        } catch { }
                    }
                }
                if (!fileObj && ch.fileBase64 && ch.fileInfo && ch.fileInfo.name) {
                    try {
                        const bytes = base64ToUint8Array(ch.fileBase64);
                        fileObj = new File([bytes], ch.fileInfo.name, {
                            type: ch.fileInfo.type || 'text/plain',
                            lastModified: ch.fileInfo.lastModified || Date.now(),
                        });
                    } catch { }
                }
                if (!fileObj && ch.fileName) {
                    fileObj = knownFiles.get(ch.fileName) || null;
                }
                if (fileInputReal && fileObj) {
                    const ok = setFileToInput(fileInputReal, fileObj);
                    if (!ok) missingFiles += 1;
                } else if (ch.fileName) {
                    // Snapshot had a file name but we can't attach it.
                    missingFiles += 1;
                }
            }
        };

        for (let i = 0; i < snap.volumes.length; i += 1) {
            await restoreVolume(wrappers[i], snap.volumes[i]);
        }

        if (typeof snap.selectedVolumeIndex === 'number' && snap.selectedVolumeIndex >= 0) {
            state._prevSelectValue = String(snap.selectedVolumeIndex);
        }
        rebuildVolumeOptions('preserve');
        if (typeof snap.selectedVolumeIndex === 'number' && snap.selectedVolumeIndex >= 0) {
            volumeSelect.value = String(snap.selectedVolumeIndex);
            handleVolumeChange();
        }

        if (missingFiles > 0) {
            log(`⚠️ Khôi phục xong, nhưng có ${missingFiles} file không thể gán lại (do giới hạn trình duyệt/dung lượng).`, 'warn');
            showUploadToast('Khôi phục xong, nhưng có file chưa gán được.', 'error', 3200);
        } else {
            log('✅ Khôi phục trạng thái xong.', 'success');
            showUploadToast('Đã khôi phục trạng thái web.', 'success', 2200);
        }
    };

    const fakeUploadBtn = shadowRoot.querySelector(`#${APP_PREFIX}fake-upload`);
    fakeUploadBtn.disabled = true;

    if (snapSaveBtn) {
        snapSaveBtn.addEventListener('click', async () => {
            await saveCurrentSnapshot();
        });
    }
    if (snapOpenBtn) {
        snapOpenBtn.addEventListener('click', () => {
            snapshotsUi.selected = new Set();
            renderSnapshotsList();
            openSnapshotsModal();
        });
    }
    if (snapshotsCloseBtn) {
        snapshotsCloseBtn.addEventListener('click', () => {
            closeSnapshotsModal();
        });
    }
    if (snapshotsOverlay) {
        snapshotsOverlay.addEventListener('click', () => {
            closeSnapshotsModal();
        });
    }
    if (snapshotsSelectAllBtn) {
        snapshotsSelectAllBtn.addEventListener('click', () => {
            snapshotsUi.selected = new Set((snapshotsUi.list || []).map(s => s?.id).filter(Boolean));
            // Re-render for simplicity to sync UI.
            renderSnapshotsList();
        });
    }
    if (snapshotsUnselectBtn) {
        snapshotsUnselectBtn.addEventListener('click', () => {
            snapshotsUi.selected = new Set();
            renderSnapshotsList();
        });
    }
    if (snapshotsDeleteBtn) {
        snapshotsDeleteBtn.addEventListener('click', async () => {
            const ids = Array.from(snapshotsUi.selected || []);
            if (!ids.length) return;
            const ok = await showUiConfirm(`Xóa ${ids.length} bản lưu đã chọn?`, 'Xóa bản lưu', 'Xóa', 'Hủy', true);
            if (!ok) return;
            for (const id of ids) {
                try { await idbDeleteSnapshotFilesBySnapshotId(id); } catch { }
            }
            const list = loadSnapshots().filter(s => !ids.includes(s?.id));
            saveSnapshots(list);
            log(`🗑 Đã xóa ${ids.length} bản lưu.`, 'warn');
            renderSnapshotsList();
        });
    }
    if (snapshotsRestoreBtn) {
        snapshotsRestoreBtn.addEventListener('click', async () => {
            const ids = Array.from(snapshotsUi.selected || []);
            if (ids.length !== 1) return;
            const snap = loadSnapshots().find(s => s?.id === ids[0]);
            if (!snap) return;
            const ok = await showUiConfirm(
                `Khôi phục bản lưu:\n${snap?.book?.title || '(Chưa có tên)'} • ${snap?.book?.author || '(Chưa có tác giả)'}\n\nHành động này sẽ ghi đè trạng thái hiện tại trên web.`,
                'Khôi phục bản lưu',
                'Khôi phục',
                'Hủy',
                false
            );
            if (!ok) return;
            closeSnapshotsModal();
            await restoreSnapshot(snap);
        });
    }

    if (autofillBtn) {
        autofillBtn.addEventListener('click', () => {
            if (typeof window.WDA_InitAutofill !== 'function') {
                log('❌ Không tìm thấy module Autofill. Kiểm tra @require.', 'error');
                return;
            }
            const instance = window.WDA_InitAutofill({ showFloatingButton: false, openOnInit: true });
            if (!instance || !instance.open) {
                log('❌ Không thể khởi tạo Autofill.', 'error');
                return;
            }
            instance.open();
            log('🔎 Đã mở panel Autofill.', 'success');
        });
    }

    fakeUploadBtn.addEventListener("click", () => {
        if (!ensureSelectedVolumeValid()) {
            return;
        }
        const realBtn = document.querySelector("#btnGetInfo");

        if (!realBtn) {
            log("❌ Không tìm thấy nút Tải lên trên web!", "error");
            return;
        }

        if (state.selectedVolumeWrapper && !settings.USE_FIRST_LINE_ONLY) {
            const trueWrapper = state.selectedVolumeWrapper.querySelector('.volume-wrapper');
            if (trueWrapper) {
                const descInfo = computeDescInfo();
                if (descInfo.text) {
                    const synced = syncAppendDesc(trueWrapper, descInfo.text);
                    if (synced) {
                        log(`🔁 Đồng bộ mô tả${descInfo.guessed ? ' (dự đoán)' : ''}: ${descInfo.text}`);
                    } else {
                        log('⚠️ Không tìm thấy ô mô tả để đồng bộ.', 'warn');
                    }
                } else {
                    log('⚠️ Không tìm thấy số chương để đồng bộ mô tả.', 'warn');
                }
                const appendModeInput = trueWrapper.querySelector('input[name="appendMode"]');
                if (appendModeInput) {
                    setInputValue(appendModeInput, 'true');
                }
            }
        }

        log("⏳ Đang nhấn nút Tải lên thật trên web...", "warn");


        realBtn.click();

        log("✅ Đã nhấn nút Tải lên!", "success");
    });

    // --- Chức năng Cài đặt ---
    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            if (settings.THEME_MODE) {
                localStorage.setItem(SHARED_THEME_KEY, settings.THEME_MODE);
            }
            log('✅ Đã lưu cài đặt.');
        } catch (e) {
            log('❌ Lỗi khi lưu cài đặt: ' + e.message, 'error');
        }
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                const loadedSettings = JSON.parse(saved);
                if (loadedSettings && typeof loadedSettings === 'object') {
                    // Dọn key cũ không còn dùng.
                    delete loadedSettings.FILE_ENCODING;
                    delete loadedSettings.FILENAME_REGEX;
                    delete loadedSettings.CONTENT_REGEX;
                }

                settings = { ...settings, ...loadedSettings };
                log('Tải cài đặt đã lưu.');
            }
            const sharedTheme = localStorage.getItem(SHARED_THEME_KEY);
            if (sharedTheme) {
                settings.THEME_MODE = sharedTheme;
            }
        } catch (e) {
            log('⚠️ Lỗi khi tải cài đặt, dùng mặc định.', 'warn');
        }
    }


    loadSettings();
    applyTheme(settings.THEME_MODE || DEFAULT_THEME_MODE);
    installFormDataPatch();

    // --- Chức năng chính ---

    function rebuildVolumeOptions(defaultSelectStrategy = 'lastAppendable') {
        const wrappers = [...document.querySelectorAll('.volume-info-wrapper')];
        volumeSelect.innerHTML = '<option value="-1" disabled selected>-- Chọn quyển để thêm chương --</option>';

        let lastAppendableIndex = -1;

        wrappers.forEach((wrapper, index) => {
            if (index === wrappers.length - 1) return;
            const trueWrapper = wrapper.querySelector('.volume-wrapper');
            const nameEl = wrapper.querySelector('input[name="nameCn"]');

            let name = nameEl ? nameEl.value.trim() : `Quyển ${index + 1}`;
            const isAppendable = !!(trueWrapper && trueWrapper.getAttribute('data-append') === 'true');


            const descEl = wrapper.querySelector('.volume-name-desc');
            const descText = (descEl ? descEl.textContent : '').trim();
            const cannotModify =
                /không thể chỉnh sửa/i.test(descText) ||
                (!isAppendable && !wrapper.querySelector('[data-action="addChapterInfo"]') && !wrapper.querySelector('.form-chapter'));

            if (isAppendable) {
                name += ' (Bổ sung)';
                lastAppendableIndex = index;
            }

            const opt = document.createElement('option');
            opt.value = String(index);
            opt.textContent = `${index + 1}. ${name}`;
            opt.dataset.isAppendable = String(isAppendable);
            opt.dataset.cannotModify = String(!!cannotModify);

            if (cannotModify) {
                opt.textContent += ' — Không thể bổ sung';
            }

            volumeSelect.appendChild(opt);
        });


        if (defaultSelectStrategy === 'preserve' && state._prevSelectValue != null) {

            const exists = [...volumeSelect.options].some(o => o.value === state._prevSelectValue && !o.disabled);
            if (exists) volumeSelect.value = state._prevSelectValue;
        } else if (defaultSelectStrategy === 'lastAppendable' && state.isEditPage && lastAppendableIndex !== -1) {
            volumeSelect.value = String(lastAppendableIndex);
        }
        if (state.volumeStatsEnabled && state.volumeStatsData) {
            injectVolumeStatsToPage(state.volumeStatsData);
        }
    }

    function handleVolumeChange() {
        const selectedOption = volumeSelect.options[volumeSelect.selectedIndex];
        if (!selectedOption || selectedOption.value === '-1' || selectedOption.disabled) {
            state.selectedVolumeWrapper = null;
            uploadBtn.disabled = true;
            if (deleteVolumeBtn) deleteVolumeBtn.disabled = true;
            if (autofillBtn) autofillBtn.disabled = true;
            if (fakeUploadBtn) fakeUploadBtn.disabled = true;
            log('⛔ Hãy chọn một quyển hợp lệ.', 'warn');
            return;
        }


        const wrappers = document.querySelectorAll('.volume-info-wrapper');
        const selectedIndex = parseInt(selectedOption.value, 10);
        state.selectedVolumeWrapper = wrappers[selectedIndex];

        if (!state.selectedVolumeWrapper) {
            uploadBtn.disabled = true;
            if (deleteVolumeBtn) deleteVolumeBtn.disabled = true;
            log('❌ Không lấy được quyển đã chọn.', 'error');
            return;
        }

        const trueWrapper = state.selectedVolumeWrapper.querySelector('.volume-wrapper');
        const isAppendable = selectedOption.dataset.isAppendable === 'true';
        const cannotModify = selectedOption.dataset.cannotModify === 'true';


        if (cannotModify) {
            manualInputContainer.style.display = 'none';
            manualInputContainer.innerHTML = '';
            uploadBtn.disabled = true;
            if (fakeUploadBtn) fakeUploadBtn.disabled = true;
            if (autofillBtn) autofillBtn.disabled = true;
            if (deleteVolumeBtn) deleteVolumeBtn.disabled = false;
            log(`⛔ Quyển "${selectedOption.textContent}" không thể bổ sung. Chỉ dùng Add New hoặc Xóa.`, 'warn');
            return;
        }

        if (state.isEditPage && trueWrapper && trueWrapper.classList.contains('readonly')) {
            trueWrapper.classList.remove('readonly');
            log('🔓 Đã bỏ readonly của quyển.');
        }

        if (isAppendable) {

            const addButton = state.selectedVolumeWrapper.querySelector('.btn-add-volume[data-action="appendLastVolume"]');
            const appendSection = state.selectedVolumeWrapper.querySelector('.append-last-volume');
            if (addButton && appendSection && appendSection.classList.contains('hide')) {
                addButton.click();
                log(`Đã mở mục thêm file của quyển "${selectedOption.textContent}".`);
            } else {
                log(`Đã chọn quyển "${selectedOption.textContent}".`);
            }
        } else {

            log(`Đã chọn quyển "${selectedOption.textContent}" (không bổ sung).`);
        }


        manualInputContainer.style.display = 'none';
        manualInputContainer.innerHTML = '';

        uploadBtn.disabled = false;
        if (deleteVolumeBtn) {
            deleteVolumeBtn.disabled = !(state.isNewBookPage || state.isEditPage);
        }
        if (autofillBtn) autofillBtn.disabled = false;
    }


    function initialize() {
        log('Khởi tạo... 🚀');


        rebuildVolumeOptions('none');


        state.selectedVolumeWrapper = null;
        uploadBtn.disabled = true;
        if (deleteVolumeBtn) deleteVolumeBtn.disabled = true;


        manualInputContainer.style.display = 'none';
        manualInputContainer.innerHTML = '';

        log('Sẵn sàng. Vui lòng chọn quyển.');
    }

    const BUILTIN_FILENAME_NUMERIC_REGEX = /(?:chương|c|q|quyển|chap|chapter|第)?\s*(\d+)\s*[:\-.]*\s*(.*)/i;
    const BUILTIN_FILENAME_CHINESE_REGEX = /第\s*([一二三四五六七八九十百千万两零\d]+)\s*章\s*(.*)/i;
    const BUILTIN_CONTENT_CHINESE_REGEX = /^第\s*([一二三四五六七八九十百千万两零\d]+)\s*章\s*(.*)/i;
    const BUILTIN_CONTENT_NUMERIC_REGEX = /^(\d+)[\s.\-:]*(.*)/;
    const TITLE_CHINESE_PREFIX_REGEX = /^第\s*([一二三四五六七八九十百千万两零\d]+)\s*章[\s:：\-_.]*(.*)$/i;
    const TITLE_COMMON_PREFIX_REGEX = /^(?:chương|chapter|chap|c|q|quyển)\s*(\d+)[\s:：\-_.]*(.*)$/i;
    const CHINESE_NUMERALS = Object.freeze({
        '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9
    });
    const CHINESE_UNITS = Object.freeze({ '十': 10, '百': 100, '千': 1000, '万': 10000 });

    function chineseToArabic(text) {
        const raw = String(text || '').trim();
        if (!raw) return NaN;
        if (/^\d+$/.test(raw)) return parseInt(raw, 10);

        let result = 0;
        let section = 0;
        let number = 0;
        for (const ch of raw) {
            if (Object.prototype.hasOwnProperty.call(CHINESE_NUMERALS, ch)) {
                number = CHINESE_NUMERALS[ch];
                continue;
            }
            if (ch === '万') {
                result += (section + number) * 10000;
                section = 0;
                number = 0;
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(CHINESE_UNITS, ch)) {
                const unitValue = CHINESE_UNITS[ch];
                if (unitValue === 10 && number === 0) number = 1;
                section += number * unitValue;
                number = 0;
            }
        }

        result += section + number;
        if (raw.length > 1 && raw.startsWith('十') && result > 10) {
            const tail = String(result).slice(1);
            result = tail ? (parseInt(tail, 10) + 10) : 10;
        }
        return Number.isFinite(result) ? result : NaN;
    }

    function parseLeadingChapterPrefix(text) {
        const raw = String(text || '').trim();
        if (!raw) return null;

        let m = raw.match(TITLE_CHINESE_PREFIX_REGEX);
        if (m) {
            const num = chineseToArabic(m[1]);
            if (!Number.isNaN(num)) return { num, rest: (m[2] || '').trim() };
        }

        m = raw.match(TITLE_COMMON_PREFIX_REGEX);
        if (m) {
            const num = parseInt(m[1], 10);
            if (!Number.isNaN(num)) return { num, rest: (m[2] || '').trim() };
        }
        return null;
    }

    function dedupeRepeatedChapterPrefix(num, title) {
        if (typeof num !== 'number' || Number.isNaN(num)) return String(title || '').trim();
        let current = String(title || '').trim();
        for (let i = 0; i < 4; i += 1) {
            const parsed = parseLeadingChapterPrefix(current);
            if (!parsed || parsed.num !== num) break;
            current = parsed.rest.trim();
        }
        return current;
    }

    function createParseResult(num, title, source) {
        if (typeof num !== 'number' || Number.isNaN(num)) return null;
        return {
            num,
            title: dedupeRepeatedChapterPrefix(num, title),
            source,
        };
    }

    function parseChapterFromFilename(filenameBase) {
        const text = String(filenameBase || '').trim();
        if (!text) return null;

        let m = text.match(BUILTIN_FILENAME_CHINESE_REGEX);
        if (m) {
            const num = chineseToArabic(m[1]);
            const parsed = createParseResult(num, m[2] || '', 'filename');
            if (parsed) return parsed;
        }

        m = text.match(BUILTIN_FILENAME_NUMERIC_REGEX);
        if (m) {
            const num = parseInt(m[1], 10);
            const parsed = createParseResult(num, m[2] || '', 'filename');
            if (parsed) return parsed;
        }
        return null;
    }

    function parseChapterFromContent(firstLine) {
        const text = String(firstLine || '').trim();
        if (!text) return null;

        let m = text.match(BUILTIN_CONTENT_CHINESE_REGEX);
        if (m) {
            const num = chineseToArabic(m[1]);
            const parsed = createParseResult(num, m[2] || '', 'content');
            if (parsed) return parsed;
        }

        m = text.match(BUILTIN_CONTENT_NUMERIC_REGEX);
        if (m) {
            const num = parseInt(m[1], 10);
            const parsed = createParseResult(num, m[2] || '', 'content');
            if (parsed) return parsed;
        }
        return null;
    }

    function normalizeEncodingLabel(enc) {
        return (enc || '').toString().trim().toLowerCase();
    }

    function isUtf8Encoding(enc) {
        const n = normalizeEncodingLabel(enc);
        return n === 'utf-8' || n === 'utf8';
    }

    function extractFirstLine(text) {
        if (!text) return '';
        let firstLine = text.split(/\r?\n/)[0].trim();
        if (firstLine.length > 500) firstLine = firstLine.substring(0, 500);
        return firstLine;
    }

    function readFileAsArrayBuffer(file, size) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result || null);
            reader.onerror = () => resolve(null);
            if (typeof size === 'number' && size > 0) {
                reader.readAsArrayBuffer(file.slice(0, size));
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    function detectBomEncoding(bytes) {
        if (!bytes || bytes.length < 2) return null;
        if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return 'utf-8';
        if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'utf-16le';
        if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'utf-16be';
        return null;
    }

    function decodeBufferWithEncoding(buffer, encoding) {
        try {
            const decoder = new TextDecoder(encoding, { fatal: false });
            return decoder.decode(buffer);
        } catch (_) {
            return '';
        }
    }

    function scoreDecodedLine(line, hasRegexMatch) {
        if (!line) return -1e9;
        const replacementCount = (line.match(/\uFFFD/g) || []).length;
        const controlCount = (line.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length;
        const cjkCount = (line.match(/[\u3400-\u9FFF]/g) || []).length;
        const letterNumCount = (line.match(/[A-Za-z0-9]/g) || []).length;
        const punctuationCount = (line.match(/[，。！？：；、“”‘’《》【】（）\[\]{}()\-_.:,'"?!]/g) || []).length;

        let score = 0;
        score += cjkCount * 2.0;
        score += letterNumCount * 1.0;
        score += punctuationCount * 0.2;
        score -= replacementCount * 150;
        score -= controlCount * 60;
        if (hasRegexMatch) score += 1200;
        return score;
    }

    async function readFirstLineOfFile(file) {
        const buffer = await readFileAsArrayBuffer(file, 4096);
        if (!buffer) {
            return { firstLine: '', detectedEncoding: 'unknown', isUtf8: false };
        }

        const bytes = new Uint8Array(buffer);
        const bomEncoding = detectBomEncoding(bytes);
        if (bomEncoding) {
            const text = decodeBufferWithEncoding(buffer, bomEncoding);
            return {
                firstLine: extractFirstLine(text),
                detectedEncoding: bomEncoding,
                isUtf8: isUtf8Encoding(bomEncoding),
            };
        }

        const candidates = ['utf-8', 'gb18030', 'gbk', 'utf-16le', 'utf-16be', 'windows-1252'];
        let bestLine = '';
        let bestEncoding = 'unknown';
        let bestScore = -1e9;

        for (const enc of candidates) {
            const decoded = decodeBufferWithEncoding(buffer, enc);
            const line = extractFirstLine(decoded);
            const hasRegexMatch = !!parseChapterFromContent(line);
            const score = scoreDecodedLine(line, hasRegexMatch);
            if (score > bestScore) {
                bestScore = score;
                bestLine = line;
                bestEncoding = enc;
            }
        }

        return {
            firstLine: bestLine,
            detectedEncoding: bestEncoding,
            isUtf8: isUtf8Encoding(bestEncoding),
        };
    }

    async function convertFileToUtf8(file, sourceEncoding) {
        if (typeof File !== 'function') {
            throw new Error('Trình duyệt không hỗ trợ tạo File mới');
        }
        const buffer = await readFileAsArrayBuffer(file);
        if (!buffer) {
            throw new Error('Không đọc được nội dung file');
        }
        const text = decodeBufferWithEncoding(buffer, sourceEncoding || 'utf-8');
        return new File([text], file.name, {
            type: file.type || 'text/plain;charset=utf-8',
            lastModified: file.lastModified || Date.now(),
        });
    }

    const EMOJI_CHAR_REGEX = (() => {
        try {
            return new RegExp('\\p{Extended_Pictographic}', 'u');
        } catch (_) {
            return null;
        }
    })();

    async function readFileAsTextWithEncoding(file, encoding) {
        const buffer = await readFileAsArrayBuffer(file);
        if (!buffer) return '';
        const normalized = normalizeEncodingLabel(encoding);
        const useEncoding = (normalized && normalized !== 'unknown') ? normalized : 'utf-8';
        let text = decodeBufferWithEncoding(buffer, useEncoding);
        if (!text && useEncoding !== 'utf-8') {
            text = decodeBufferWithEncoding(buffer, 'utf-8');
        }
        return text || '';
    }

    function formatCodePoint(cp) {
        return `U+${cp.toString(16).toUpperCase()}`;
    }

    function isEmojiCodePoint(ch, cp) {
        if (EMOJI_CHAR_REGEX) return EMOJI_CHAR_REGEX.test(ch);
        return cp >= 0x1F000 && cp <= 0x1FAFF;
    }

    function analyze4ByteChars(text) {
        let total4Byte = 0;
        let emojiCount = 0;
        const samples = [];
        for (const ch of String(text || '')) {
            const cp = ch.codePointAt(0);
            if (!cp || cp <= 0xFFFF) continue;
            total4Byte += 1;
            if (isEmojiCodePoint(ch, cp)) emojiCount += 1;
            if (samples.length < 6) {
                samples.push(`${ch} (${formatCodePoint(cp)})`);
            }
        }
        return { total4Byte, emojiCount, samples };
    }

    function transform4ByteChars(text, mode) {
        const raw = String(text || '');
        if (mode === 'keep') return raw;
        let out = '';
        for (const ch of raw) {
            const cp = ch.codePointAt(0);
            if (cp && cp > 0xFFFF) {
                if (mode === 'text') {
                    out += `<${formatCodePoint(cp)}>`;
                }
                continue;
            }
            out += ch;
        }
        return out;
    }

    const RISKY_PUNCTUATION_CHAR = '、';
    const NORMALIZED_PUNCTUATION_CHAR = ',';
    const ZERO_WIDTH_CHARS = ['\u200B', '\u200C', '\u200D', '\u2060', '\uFEFF'];
    const ZERO_WIDTH_LABELS = {
        '\u200B': 'U+200B (ZERO WIDTH SPACE)',
        '\u200C': 'U+200C (ZERO WIDTH NON-JOINER)',
        '\u200D': 'U+200D (ZERO WIDTH JOINER)',
        '\u2060': 'U+2060 (WORD JOINER)',
        '\uFEFF': 'U+FEFF (BOM/ZWNBSP)',
    };

    function analyzeRiskyPunctuation(text) {
        const raw = String(text || '');
        let count = 0;
        for (const ch of raw) {
            if (ch === RISKY_PUNCTUATION_CHAR) count += 1;
        }
        return count;
    }

    function normalizeRiskyPunctuation(text) {
        return String(text || '').split(RISKY_PUNCTUATION_CHAR).join(NORMALIZED_PUNCTUATION_CHAR);
    }

    function analyzeZeroWidthChars(text) {
        const raw = String(text || '');
        const detail = {};
        let total = 0;
        for (const ch of raw) {
            if (!ZERO_WIDTH_LABELS[ch]) continue;
            detail[ch] = (detail[ch] || 0) + 1;
            total += 1;
        }
        return { total, detail };
    }

    function removeZeroWidthChars(text) {
        let out = String(text || '');
        for (const ch of ZERO_WIDTH_CHARS) {
            out = out.split(ch).join('');
        }
        return out;
    }

    async function processZeroWidthFiles(files, scanByFile) {
        if (!Array.isArray(files) || files.length === 0) return { files, scanByFile };
        log('Đang quét ký tự ẩn zero-width...');

        const textByFile = new Map();
        const affectedEntries = [];
        const globalDetail = {};
        let totalCount = 0;

        for (const file of files) {
            const scan = scanByFile.get(file) || { detectedEncoding: 'utf-8' };
            const text = await readFileAsTextWithEncoding(file, scan.detectedEncoding);
            textByFile.set(file, text);
            const result = analyzeZeroWidthChars(text);
            if (result.total > 0) {
                affectedEntries.push({ file, total: result.total, detail: result.detail });
                totalCount += result.total;
                Object.entries(result.detail).forEach(([ch, n]) => {
                    globalDetail[ch] = (globalDetail[ch] || 0) + n;
                });
            }
        }

        if (totalCount === 0) {
            log('✅ Không phát hiện ký tự ẩn zero-width.');
            return { files, scanByFile };
        }

        const detailText = Object.entries(globalDetail)
            .map(([ch, n]) => `${ZERO_WIDTH_LABELS[ch] || formatCodePoint(ch.codePointAt(0) || 0)}: ${n}`)
            .join(', ');
        const previewLimit = 12;
        const previewLines = affectedEntries
            .slice(0, previewLimit)
            .map((entry) => `- ${entry.file.name}: ${entry.total} ký tự`)
            .join('\n');
        const moreLine = affectedEntries.length > previewLimit
            ? `\n... và ${affectedEntries.length - previewLimit} file khác.`
            : '';

        log(`⚠️ Phát hiện ${totalCount} ký tự ẩn zero-width trong ${affectedEntries.length} file.`, 'warn');
        const shouldClean = await showUiConfirm(
            `Phát hiện ${totalCount} ký tự ẩn zero-width trong ${affectedEntries.length} file.\n` +
            `Chi tiết: ${detailText}\n\n` +
            `Các ký tự này có thể làm web dịch tách chữ thành "mỗi từ cách nhau bất thường".\n` +
            `Bạn có muốn xóa chúng trước khi upload không?\n\n` +
            `${previewLines}${moreLine}`,
            'Làm sạch ký tự ẩn',
            'Xóa ký tự ẩn',
            'Giữ nguyên'
        );

        if (!shouldClean) {
            log('Giữ nguyên ký tự ẩn zero-width theo file gốc.', 'warn');
            return { files, scanByFile };
        }

        const cleanedFiles = [];
        const cleanedScanByFile = new Map();
        let cleanedFileCount = 0;
        let cleanedCharCount = 0;
        const affectedMap = new Map(affectedEntries.map((entry) => [entry.file, entry.total]));

        for (const file of files) {
            const scan = scanByFile.get(file) || { firstLine: '', detectedEncoding: 'unknown', isUtf8: false };
            const count = affectedMap.get(file) || 0;
            if (!count) {
                cleanedFiles.push(file);
                cleanedScanByFile.set(file, scan);
                continue;
            }

            const sourceText = textByFile.get(file) || '';
            const newText = removeZeroWidthChars(sourceText);
            const newFile = new File([newText], file.name, {
                type: file.type || 'text/plain;charset=utf-8',
                lastModified: file.lastModified || Date.now(),
            });
            cleanedFiles.push(newFile);
            cleanedScanByFile.set(newFile, {
                firstLine: extractFirstLine(newText),
                detectedEncoding: 'utf-8',
                isUtf8: true,
            });
            cleanedFileCount += 1;
            cleanedCharCount += count;
        }

        log(`✅ Đã xóa ${cleanedCharCount} ký tự ẩn zero-width trong ${cleanedFileCount} file.`, 'success');
        return {
            files: cleanedFiles,
            scanByFile: cleanedScanByFile
        };
    }

    async function processRiskyPunctuationFiles(files, scanByFile) {
        if (!Array.isArray(files) || files.length === 0) return { files, scanByFile };
        log(`Đang quét ký tự có thể bị web chặn (${RISKY_PUNCTUATION_CHAR})...`);

        const textByFile = new Map();
        const affectedEntries = [];
        let totalCount = 0;

        for (const file of files) {
            const scan = scanByFile.get(file) || { detectedEncoding: 'utf-8' };
            const text = await readFileAsTextWithEncoding(file, scan.detectedEncoding);
            textByFile.set(file, text);
            const count = analyzeRiskyPunctuation(text);
            if (count > 0) {
                totalCount += count;
                affectedEntries.push({ file, count });
            }
        }

        if (totalCount === 0) {
            log(`✅ Không phát hiện ký tự ${RISKY_PUNCTUATION_CHAR}.`);
            return { files, scanByFile };
        }

        const previewLimit = 12;
        const previewLines = affectedEntries
            .slice(0, previewLimit)
            .map((entry) => `- ${entry.file.name}: ${entry.count} ký tự`)
            .join('\n');
        const moreLine = affectedEntries.length > previewLimit
            ? `\n... và ${affectedEntries.length - previewLimit} file khác.`
            : '';

        log(`⚠️ Phát hiện ${totalCount} ký tự ${RISKY_PUNCTUATION_CHAR} trong ${affectedEntries.length} file.`, 'warn');
        const shouldNormalize = await showUiConfirm(
            `Phát hiện ${totalCount} ký tự "${RISKY_PUNCTUATION_CHAR}" (dấu phẩy Nhật) trong ${affectedEntries.length} file.\n` +
            `Web chính thức có thể từ chối các ký tự này.\n` +
            `Bạn có muốn chuẩn hóa thành "${NORMALIZED_PUNCTUATION_CHAR}" trước khi upload không?\n\n` +
            `${previewLines}${moreLine}`,
            'Chuẩn hóa ký tự dễ lỗi',
            'Chuẩn hóa',
            'Giữ nguyên'
        );

        if (!shouldNormalize) {
            log(`Giữ nguyên ký tự "${RISKY_PUNCTUATION_CHAR}" theo file gốc.`, 'warn');
            return { files, scanByFile };
        }

        const normalizedFiles = [];
        const normalizedScanByFile = new Map();
        let normalizedFileCount = 0;
        let normalizedCharCount = 0;
        const affectedMap = new Map(affectedEntries.map((entry) => [entry.file, entry.count]));

        for (const file of files) {
            const scan = scanByFile.get(file) || { firstLine: '', detectedEncoding: 'unknown', isUtf8: false };
            const count = affectedMap.get(file) || 0;
            if (!count) {
                normalizedFiles.push(file);
                normalizedScanByFile.set(file, scan);
                continue;
            }

            const sourceText = textByFile.get(file) || '';
            const newText = normalizeRiskyPunctuation(sourceText);
            const newFile = new File([newText], file.name, {
                type: file.type || 'text/plain;charset=utf-8',
                lastModified: file.lastModified || Date.now(),
            });
            normalizedFiles.push(newFile);
            normalizedScanByFile.set(newFile, {
                firstLine: extractFirstLine(newText),
                detectedEncoding: 'utf-8',
                isUtf8: true,
            });
            normalizedFileCount += 1;
            normalizedCharCount += count;
        }

        log(`✅ Đã chuẩn hóa ${normalizedCharCount} ký tự "${RISKY_PUNCTUATION_CHAR}" trong ${normalizedFileCount} file.`, 'success');
        return {
            files: normalizedFiles,
            scanByFile: normalizedScanByFile
        };
    }

    async function processFourByteFiles(files, scanByFile) {
        if (!Array.isArray(files) || files.length === 0) return { files, scanByFile };
        log(`Đang quét ký tự 4-byte/emoji trong ${files.length} file...`);

        const analysisByFile = new Map();
        const textByFile = new Map();
        const affectedEntries = [];
        let total4Byte = 0;
        let totalEmoji = 0;

        for (const file of files) {
            const scan = scanByFile.get(file) || { detectedEncoding: 'utf-8' };
            const text = await readFileAsTextWithEncoding(file, scan.detectedEncoding);
            textByFile.set(file, text);
            const analysis = analyze4ByteChars(text);
            analysisByFile.set(file, analysis);
            if (analysis.total4Byte > 0) {
                total4Byte += analysis.total4Byte;
                totalEmoji += analysis.emojiCount;
                affectedEntries.push({
                    file,
                    total4Byte: analysis.total4Byte,
                    emojiCount: analysis.emojiCount,
                    sample: analysis.samples[0] || ''
                });
            }
        }

        if (affectedEntries.length === 0) {
            log('✅ Không phát hiện ký tự 4-byte/emoji.');
            return { files, scanByFile };
        }

        log(`⚠️ Phát hiện ${total4Byte} ký tự 4-byte (emoji/icon: ${totalEmoji}) trong ${affectedEntries.length} file.`, 'warn');
        const previewLimit = 10;
        const previewLines = affectedEntries
            .slice(0, previewLimit)
            .map((entry) => `- ${entry.file.name}: 4-byte=${entry.total4Byte}, emoji=${entry.emojiCount}${entry.sample ? `, mẫu ${entry.sample}` : ''}`)
            .join('\n');
        const moreLine = affectedEntries.length > previewLimit
            ? `\n... và ${affectedEntries.length - previewLimit} file khác.`
            : '';

        const mode = await showUiThreeChoice(
            `Phát hiện ${total4Byte} ký tự 4-byte (emoji/icon: ${totalEmoji}) trong ${affectedEntries.length} file.\n` +
            `Chọn cách xử lý trước khi upload:\n` +
            `- Đổi sang text (khuyên dùng): icon -> <U+XXXXXX>.\n` +
            `- Xóa icon (an toàn): loại bỏ toàn bộ ký tự 4-byte.\n` +
            `- Giữ nguyên: có thể lỗi upload trên web chính thức.\n` +
            `Lưu ý: một số ký tự như dấu phẩy Nhật "、" cũng có thể bị web từ chối.\n\n` +
            `${previewLines}${moreLine}`,
            'Cảnh báo ký tự dễ lỗi upload'
        );

        if (mode === 'keep') {
            log('Giữ nguyên ký tự 4-byte/emoji theo file gốc.', 'warn');
            return { files, scanByFile };
        }

        const transformedFiles = [];
        const transformedScanByFile = new Map();
        let transformedCount = 0;
        let transformedChars = 0;

        for (const file of files) {
            const scan = scanByFile.get(file) || { firstLine: '', detectedEncoding: 'unknown', isUtf8: false };
            const analysis = analysisByFile.get(file) || { total4Byte: 0 };
            if (!analysis.total4Byte) {
                transformedFiles.push(file);
                transformedScanByFile.set(file, scan);
                continue;
            }

            const sourceText = textByFile.get(file) || '';
            const newText = transform4ByteChars(sourceText, mode);
            const newFile = new File([newText], file.name, {
                type: file.type || 'text/plain;charset=utf-8',
                lastModified: file.lastModified || Date.now(),
            });
            transformedFiles.push(newFile);
            transformedScanByFile.set(newFile, {
                firstLine: extractFirstLine(newText),
                detectedEncoding: 'utf-8',
                isUtf8: true,
            });
            transformedCount += 1;
            transformedChars += analysis.total4Byte;
        }

        const modeText = mode === 'text' ? 'Đổi sang text' : 'Xóa icon';
        log(`✅ ${modeText}: đã xử lý ${transformedChars} ký tự 4-byte trong ${transformedCount} file.`, 'success');
        return {
            files: transformedFiles,
            scanByFile: transformedScanByFile
        };
    }

    async function parseFileSmart(file, scanInfo = null) {
        const priority = settings.PARSE_PRIORITY;
        const filenameBase = file.name.replace(/\.txt$/i, '');

        let result = null;
        let firstLine = '';
        let scanned = scanInfo;
        const ensureScan = async () => {
            if (!scanned) scanned = await readFirstLineOfFile(file);
            return scanned;
        };


        if (priority === 'filename') {
            result = parseChapterFromFilename(filenameBase);
            if (result) {
                return {
                    ...result,
                    detectedEncoding: scanned ? scanned.detectedEncoding : 'unknown'
                };
            }

            firstLine = (await ensureScan()).firstLine;
            result = parseChapterFromContent(firstLine);
            if (result) return { ...result, detectedEncoding: scanned.detectedEncoding };
        } else {
            firstLine = (await ensureScan()).firstLine;
            result = parseChapterFromContent(firstLine);
            if (result) return { ...result, detectedEncoding: scanned.detectedEncoding };

            result = parseChapterFromFilename(filenameBase);
            if (result) return { ...result, detectedEncoding: scanned.detectedEncoding };
        }

        return null;
    }

    function applyTemplate(template, num, title) {
        return template
            .replace(/{num}/g, num.toString())
            .replace(/{title}/g, title || '');
    }


    async function handleFileSelect(event) {
        if (!ensureSelectedVolumeValid()) {
            fileInput.value = "";
            return;
        }
        state.previewOrder = null;
        state.remainingInvalidFiles = [];
        state._previewWrapperEl = null;

        const files = Array.from(event.target.files);
        if (files.length === 0) {
            log('Không có file nào được chọn.', 'warn');
            return;
        }

        log(`Đã chọn ${files.length} file. Đang xử lý...`);
        manualInputContainer.innerHTML = '';
        state.validFiles = [];
        state.invalidFiles = [];


        const warningSize = settings.FILE_SIZE_WARNING_KB * 1024;
        const smallFiles = files.filter(f => f.size < warningSize);

        if (smallFiles.length > 0 && warningSize > 0) {
            log(`⚠️ Phát hiện ${smallFiles.length} file dưới ${settings.FILE_SIZE_WARNING_KB}KB.`, 'warn');
            smallFiles.forEach(f => log(`- ${f.name} (${(f.size / 1024).toFixed(2)} KB)`, 'warn'));
            const shouldContinue = await showUiConfirm(
                `Có ${smallFiles.length} file nhỏ hơn ${settings.FILE_SIZE_WARNING_KB}KB.\nBạn có chắc chắn muốn tiếp tục không?`,
                'Cảnh báo file nhỏ',
                'Tiếp tục',
                'Hủy'
            );
            if (!shouldContinue) {
                log('⛔ Đã hủy tải lên.');
                fileInput.value = "";
                return;
            }
        }

        // Lưu tên file nhỏ để nhắc lại cuối quá trình
        state.smallFileNames = (smallFiles.length > 0 && warningSize > 0)
            ? smallFiles.map(f => f.name)
            : [];


        files.sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' }));

        log(`Đang nhận diện bảng mã của ${files.length} file...`);
        let scanByFile = new Map();
        const scanResults = await Promise.all(files.map(async (file) => {
            const scan = await readFirstLineOfFile(file);
            scanByFile.set(file, scan);
            return { file, ...scan };
        }));

        const encodingCounts = new Map();
        scanResults.forEach((entry) => {
            const key = normalizeEncodingLabel(entry.detectedEncoding) || 'unknown';
            encodingCounts.set(key, (encodingCounts.get(key) || 0) + 1);
        });
        const encodingSummary = Array.from(encodingCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([enc, count]) => `${enc}: ${count}`)
            .join(' | ');
        log(`🧬 Kết quả nhận diện bảng mã: ${encodingSummary || 'không xác định'}`);
        if (files.length <= 200) {
            scanResults.forEach((entry) => {
                log(`• ${entry.file.name}: ${entry.detectedEncoding || 'unknown'}`);
            });
        }

        const nonUtf8Entries = scanResults.filter((entry) => !entry.isUtf8);
        if (nonUtf8Entries.length > 0) {
            log(`⚠️ Có ${nonUtf8Entries.length} file không phải UTF-8.`, 'warn');
            const previewLogLimit = 60;
            nonUtf8Entries.slice(0, previewLogLimit).forEach((entry) => {
                log(`- ${entry.file.name}: ${entry.detectedEncoding || 'unknown'}`, 'warn');
            });
            if (nonUtf8Entries.length > previewLogLimit) {
                log(`... và ${nonUtf8Entries.length - previewLogLimit} file khác.`, 'warn');
            }

            const previewLimit = 12;
            const previewLines = nonUtf8Entries
                .slice(0, previewLimit)
                .map((entry) => `- ${entry.file.name} [${entry.detectedEncoding || 'unknown'}]`)
                .join('\n');
            const moreLine = nonUtf8Entries.length > previewLimit
                ? `\n... và ${nonUtf8Entries.length - previewLimit} file khác.`
                : '';
            const shouldConvert = await showUiConfirm(
                `Phát hiện ${nonUtf8Entries.length} file không phải UTF-8.\n` +
                `Bạn có muốn chuyển chúng sang UTF-8 trước khi xử lý không?\n\n` +
                `${previewLines}${moreLine}`,
                'Chuyển bảng mã',
                'Chuyển UTF-8',
                'Giữ nguyên'
            );

            if (shouldConvert) {
                log('🔄 Bắt đầu chuyển file non-UTF-8 sang UTF-8...');
                const convertedFiles = [];
                const convertedScanByFile = new Map();
                let convertedCount = 0;
                let skippedUnknownCount = 0;

                for (const oldFile of files) {
                    const scan = scanByFile.get(oldFile) || { firstLine: '', detectedEncoding: 'unknown', isUtf8: false };
                    const detectedKey = normalizeEncodingLabel(scan.detectedEncoding);
                    if (!scan.isUtf8 && detectedKey && detectedKey !== 'unknown') {
                        try {
                            const converted = await convertFileToUtf8(oldFile, scan.detectedEncoding);
                            convertedFiles.push(converted);
                            convertedScanByFile.set(converted, {
                                firstLine: scan.firstLine,
                                detectedEncoding: 'utf-8',
                                isUtf8: true,
                            });
                            convertedCount += 1;
                            log(`✅ Đã chuyển "${oldFile.name}" (${scan.detectedEncoding || 'unknown'} -> utf-8)`, 'success');
                        } catch (e) {
                            convertedFiles.push(oldFile);
                            convertedScanByFile.set(oldFile, scan);
                            log(`❌ Không thể chuyển "${oldFile.name}": ${e.message}. Giữ file gốc.`, 'error');
                        }
                    } else if (!scan.isUtf8) {
                        convertedFiles.push(oldFile);
                        convertedScanByFile.set(oldFile, scan);
                        skippedUnknownCount += 1;
                    } else {
                        convertedFiles.push(oldFile);
                        convertedScanByFile.set(oldFile, scan);
                    }
                }

                files.splice(0, files.length, ...convertedFiles);
                scanByFile = convertedScanByFile;
                log(`🎉 Hoàn tất chuyển bảng mã. Đã chuyển ${convertedCount}/${nonUtf8Entries.length} file.`, 'success');
                if (skippedUnknownCount > 0) {
                    log(`⚠️ Bỏ qua ${skippedUnknownCount} file vì không xác định được bảng mã nguồn.`, 'warn');
                }
            } else {
                log('Giữ nguyên bảng mã gốc theo file.', 'warn');
            }
        } else {
            log('✅ Tất cả file đang là UTF-8.', 'success');
        }

        const fourByteResult = await processFourByteFiles(files, scanByFile);
        files.splice(0, files.length, ...fourByteResult.files);
        scanByFile = fourByteResult.scanByFile;
        const zeroWidthResult = await processZeroWidthFiles(files, scanByFile);
        files.splice(0, files.length, ...zeroWidthResult.files);
        scanByFile = zeroWidthResult.scanByFile;
        const riskyPunctuationResult = await processRiskyPunctuationFiles(files, scanByFile);
        files.splice(0, files.length, ...riskyPunctuationResult.files);
        scanByFile = riskyPunctuationResult.scanByFile;

        state.allFiles = files;

        if (settings.USE_FIRST_LINE_ONLY) {
            log(`Đang đọc dòng đầu và sắp xếp ${files.length} file...`);
            state.validFiles = files.map((file, idx) => {
                const firstLine = ((scanByFile.get(file) || {}).firstLine || '').trim();
                return {
                    file,
                    chapterNumber: null,
                    rawTitle: firstLine
                };
            });
            state.invalidFiles = [];
            manualInputContainer.style.display = 'none';
            manualInputContainer.innerHTML = '';
            startUploading();
            return;
        }

        log(`Đang phân tích ${files.length} file (Chế độ ưu tiên: ${settings.PARSE_PRIORITY === 'content' ? 'Dòng đầu' : 'Tên file'})...`);

        const chapterNumbers = new Map();
        const parsePromises = files.map(async (file) => {
            const info = await parseFileSmart(file, scanByFile.get(file) || null);
            return { file, info };
        });

        const results = await Promise.all(parsePromises);

        for (const item of results) {
            const { file, info } = item;

            if (!info) {
                state.invalidFiles.push({ file, reason: 'Không tìm thấy số chương (cả tên file & dòng đầu).' });
                log(`❌ File "${file.name}": Parse thất bại cả 2 cách.`, 'error');
                continue;
            }

            const { num, title } = info;

            if (chapterNumbers.has(num)) {
                state.invalidFiles.push({ file, reason: `Trùng chương ${num}` });
                log(`❌ File "${file.name}" trùng chương ${num}.`, 'error');
                continue;
            }

            chapterNumbers.set(num, file);

            state.validFiles.push({ file, chapterNumber: num, rawTitle: title });
        }

        state.validFiles.sort((a, b) => a.chapterNumber - b.chapterNumber);

        let hasError = false;


        const duplicateMessages = [];
        chapterNumbers.forEach((fileList, number) => {
            if (fileList.length > 1) {
                const msg = `TRÙNG LẶP: Chương ${number} có ${fileList.length} file: ${fileList.join(', ')}`;
                log(msg, 'error');
                duplicateMessages.push(msg);
                hasError = true;
            }
        });


        let missingMessage = null;
        let minChapter, maxChapter;
        if (state.validFiles.length > 0) {
            const allChapterNums = state.validFiles.map(item => item.chapterNumber);
            minChapter = allChapterNums[0];
            maxChapter = allChapterNums[allChapterNums.length - 1];

            const missingChapters = [];
            for (let i = minChapter; i <= maxChapter; i++) {
                if (!allChapterNums.includes(i)) {
                    missingChapters.push(i);
                }
            }

            if (missingChapters.length > 0) {
                const msg = `THIẾU CHƯƠNG: ${missingChapters.join(', ')}`;
                log(msg, 'warn');
                missingMessage = msg;
                hasError = true;
            }
        }



        if (hasError) {
            manualInputContainer.style.display = 'block';
        }

        duplicateMessages.forEach(msg => {
            manualInputContainer.appendChild(createUIWarning(msg, 'error'));
        });

        if (missingMessage) {
            manualInputContainer.appendChild(createUIWarning(missingMessage, 'warn'));
        }



        if (state.invalidFiles.length > 0) {
            log(`Có ${state.invalidFiles.length} file không parse được num, cần chèn thủ công:`, 'warn');

            state.previewOrder = state.validFiles.map(item => ({
                type: 'valid',
                file: item.file,
                chapterNumber: item.chapterNumber,
                rawTitle: item.rawTitle
            }));

            state.remainingInvalidFiles = state.invalidFiles.map(x => x.file);

            buildInsertPreviewUI(manualInputContainer);

            manualInputContainer.style.display = 'block';
            hasError = true;
        }


        const trueWrapper = state.selectedVolumeWrapper.querySelector('.volume-wrapper');
        const descInfo = computeDescInfo();
        if (descInfo.text) {
            const synced = syncAppendDesc(trueWrapper, descInfo.text);
            if (synced) {
                log(`✅ Đã điền mô tả${descInfo.guessed ? ' (dự đoán)' : ''}: ${descInfo.text}`);
            } else {
                log('⚠️ Không tìm thấy ô mô tả để điền.', 'warn');
            }
        } else {
            log('Không tìm thấy số chương để điền mô tả.', 'warn');
        }


        if (hasError) {
            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = `${APP_PREFIX}button-group`;

            const continueBtn = document.createElement('button');
            continueBtn.innerText = '✅ Vẫn tiếp tục';
            continueBtn.className = `${APP_PREFIX}btn`;
            continueBtn.style.backgroundColor = '#4CAF50';

            const cancelBtn = document.createElement('button');
            cancelBtn.innerText = '❌ Hủy bỏ';
            cancelBtn.className = `${APP_PREFIX}btn`;
            cancelBtn.style.backgroundColor = '#f44336';

            buttonWrapper.appendChild(continueBtn);
            buttonWrapper.appendChild(cancelBtn);
            manualInputContainer.appendChild(buttonWrapper);

            continueBtn.onclick = () => {
                manualInputContainer.style.display = 'none';
                manualInputContainer.innerHTML = '';
                startUploading();
            };
            cancelBtn.onclick = () => {
                log('⛔ Đã dừng quá trình.');
                manualInputContainer.innerHTML = '';
                manualInputContainer.style.display = 'none';
                fileInput.value = "";
            };
        } else {

            log('Tất cả file hợp lệ. Bắt đầu tải lên...');
            manualInputContainer.style.display = 'none';
            startUploading();
        }
    }

    async function openInsertPopup(insertIndex) {
        if (state.remainingInvalidFiles.length === 0) {
            await showUiAlert('Không còn file để chèn', 'Thông báo');
            return;
        }

        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.4)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '999999';

        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.color = '#000';
        box.style.padding = '12px';
        box.style.borderRadius = '8px';
        box.style.width = '350px';
        box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

        const title = document.createElement('div');
        title.textContent = 'Chọn 1 file để chèn';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '8px';
        box.appendChild(title);

        const list = document.createElement('div');
        let selected = 0;

        state.remainingInvalidFiles.forEach((file, idx) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '8px';
            row.style.padding = '4px';
            row.style.cursor = 'pointer';

            if (idx === 0) row.style.background = '#f5f5f5';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'ins-radio';
            radio.checked = idx === 0;

            const span = document.createElement('span');
            span.textContent = file.name;

            row.onclick = () => {
                selected = idx;
                Array.from(list.children).forEach(r => { r.style.background = 'transparent'; });
                row.style.background = '#e3f2fd';
                radio.checked = true;
            };

            row.appendChild(radio);
            row.appendChild(span);
            list.appendChild(row);
        });

        box.appendChild(list);

        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.justifyContent = 'flex-end';
        btnRow.style.gap = '6px';
        btnRow.style.marginTop = '10px';

        const cancel = document.createElement('button');
        cancel.textContent = 'Hủy';
        cancel.onclick = () => document.body.removeChild(overlay);

        const ok = document.createElement('button');
        ok.textContent = 'Chèn';
        ok.style.background = '#ff9800';
        ok.style.color = '#fff';

        ok.onclick = () => {
            const file = state.remainingInvalidFiles[selected];
            if (!file) return;


            state.previewOrder.splice(insertIndex, 0, {
                type: 'insert',
                file,
                chapterNumber: null,
                rawTitle: null
            });


            state.remainingInvalidFiles.splice(selected, 1);

            document.body.removeChild(overlay);
            renderPreviewList();
        };

        btnRow.appendChild(cancel);
        btnRow.appendChild(ok);
        box.appendChild(btnRow);

        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function createPlusRow(index, label) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '6px';
        row.style.alignItems = 'center';
        row.style.padding = '4px 0';


        const leftBtn = createPlusButton(index);
        row.appendChild(leftBtn);


        const span = document.createElement('span');
        span.style.color = '#888';
        span.textContent = label || '';
        row.appendChild(span);


        const rightBtn = createPlusButton(index);
        row.appendChild(rightBtn);

        return row;
    }


    function createPlusButton(insertIndex) {
        const btn = document.createElement('button');
        btn.textContent = '+';
        btn.style.width = '22px';
        btn.style.height = '22px';
        btn.style.borderRadius = '50%';

        btn.style.border = '1px solid #ff9800';
        btn.style.background = '#fffbe6';
        btn.style.color = '#e65100';

        btn.style.cursor = 'pointer';

        btn.onclick = () => openInsertPopup(insertIndex);
        return btn;
    }

    function buildInsertPreviewUI(container) {
        container.innerHTML = `
        <div style="font-weight:bold;margin-bottom:6px;">🧩 Sắp xếp file chèn</div>
        <div style="font-size:12px;color:#ccc;margin-bottom:8px;">
            Bấm nút <b>+</b> để chèn file vào vị trí muốn.
            Nếu chèn nhầm, hãy nhấn vào ô màu cam để bỏ file đó khỏi sắp xếp.
        </div>
    `;

        const wrap = document.createElement('div');
        wrap.id = `${APP_PREFIX}preview-wrapper`;
        container.appendChild(wrap);

        state._previewWrapperEl = wrap;
        renderPreviewList();
    }

    function renderPreviewList() {
        const wrapper = state._previewWrapperEl;
        if (!wrapper) return;

        wrapper.innerHTML = '';

        const list = state.previewOrder;




        list.forEach((item, idx) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '6px';
            row.style.padding = '4px 0';

            if (item.type === 'insert') {
                row.style.background = '#fff8e1';
                row.style.borderRadius = '4px';
                row.style.border = '1px dashed #ffc107';
                row.style.cursor = 'pointer';
                row.title = 'Nhấn để bỏ file này khỏi sắp xếp';


                row.addEventListener('click', async (ev) => {

                    const target = ev.target;
                    if (target && target.tagName && target.tagName.toLowerCase() === 'button') {
                        return;
                    }

                    const shouldRemove = await showUiConfirm(
                        'Bỏ file này khỏi danh sách sắp xếp và đưa lại về bảng chọn file?',
                        'Xác nhận bỏ file',
                        'Bỏ file',
                        'Giữ lại',
                        true
                    );
                    if (!shouldRemove) {
                        return;
                    }


                    const removedList = state.previewOrder.splice(idx, 1);
                    const removed = removedList && removedList[0];


                    if (removed && removed.file) {
                        if (!Array.isArray(state.remainingInvalidFiles)) {
                            state.remainingInvalidFiles = [];
                        }
                        state.remainingInvalidFiles.push(removed.file);
                    }

                    renderPreviewList();
                });
            }



            row.appendChild(createPlusButton(idx));

            const text = document.createElement('span');
            text.style.flex = '1';
            text.style.whiteSpace = 'nowrap';
            text.style.overflow = 'hidden';
            text.style.textOverflow = 'ellipsis';

            if (item.type === 'valid') {
                text.textContent = `C.${item.chapterNumber} - ${item.file.name}`;
            } else {
                text.textContent = item.file.name;
                text.style.color = '#e65100';
            }
            row.appendChild(text);


            row.appendChild(createPlusButton(idx + 1));

            wrapper.appendChild(row);
        });


    }


    function createUIWarning(message, type = 'error') {
        const wrapper = document.createElement('div');
        wrapper.className = `${APP_PREFIX}manual-file-entry`;

        const label = document.createElement('label');

        label.style.color = (type === 'error') ? '#d9534f' : '#f0ad4e';
        label.style.fontSize = '13px';
        label.style.fontWeight = 'bold';
        label.innerText = message;

        wrapper.appendChild(label);
        return wrapper;
    }


    async function startUploading() {
        showUploadToast('Đang gán tên chương và file lên web...', 'loading');
        log('🚀 Bắt đầu quá trình điền file...');
        const trueWrapper = state.selectedVolumeWrapper.querySelector('.volume-wrapper');
        if (!trueWrapper) {
            log('Lỗi: Không tìm thấy .volume-wrapper. Đã dừng.', 'error');
            showUploadToast('Không tìm thấy form chương để gán dữ liệu.', 'error', 3200);
            return;
        }

        let mergedFiles;

        if (state.previewOrder && state.previewOrder.length > 0) {
            mergedFiles = state.previewOrder.map(item => ({
                file: item.file,
                chapterNumber: item.chapterNumber,
                rawTitle: item.rawTitle
            }));
        } else {
            mergedFiles = state.validFiles.map(item => ({
                file: item.file,
                chapterNumber: item.chapterNumber,
                rawTitle: item.rawTitle
            }));
        }


        const targetCount = mergedFiles.length;
        if (targetCount === 0) {
            log('Không có file nào để tải lên. Đã dừng.', 'warn');
            showUploadToast('Không có file hợp lệ để gán.', 'error', 2600);
            return;
        }

        log(`Tổng cộng sẽ tải lên ${targetCount} file.`);


        const addChapterBtn = trueWrapper.querySelector('[data-action="addChapterInfo"]');
        const chapterWrapperContainer = trueWrapper.querySelector('.chapter-wrapper');

        if (!addChapterBtn || !chapterWrapperContainer) {
            log('Lỗi nghiêm trọng: Không tìm thấy nút thêm chương hoặc vùng chứa chương.', 'error');
            showUploadToast('Thiếu phần tử form upload trên web.', 'error', 3200);
            return;
        }

        const numFileInput = trueWrapper.querySelector('input[name="numFile"]');
        const getRowCount = () => chapterWrapperContainer.querySelectorAll('.chapter-info-wrapper').length;
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        const getTiming = () => {
            if (targetCount <= 10) {
                return { waitTimeout: 1000, stableMs: 120, settleMs: 40, verifyMs: 60, clickDelay: 0 };
            }
            if (targetCount <= 100) {
                return { waitTimeout: 1500, stableMs: 180, settleMs: 100, verifyMs: 120, clickDelay: 10 };
            }
            return { waitTimeout: 5000, stableMs: 220, settleMs: 160, verifyMs: 120, clickDelay: 30 };
        };
        const timing = getTiming();
        const waitForRowCount = async (count, timeout = timing.waitTimeout) => {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                if (getRowCount() === count) {
                    return true;
                }
                await sleep(60);
            }
            return false;
        };

        const resetChapterRows = async () => {
            const rows = [...chapterWrapperContainer.querySelectorAll('.chapter-info-wrapper')];
            if (rows.length === 0) return;
            rows.forEach(row => {
                const removeBtn = row.querySelector('[data-action="removeChapter"]');
                if (removeBtn) removeBtn.click();
                else row.remove();
            });
            const cleared = await waitForRowCount(0, 1200);
            if (!cleared) {
                [...chapterWrapperContainer.querySelectorAll('.chapter-info-wrapper')].forEach(row => row.remove());
            }
            log('🧹 Đã làm sạch danh sách chương cũ.');
        };

        const trimExtraRows = async (count) => {
            const rows = [...chapterWrapperContainer.querySelectorAll('.chapter-info-wrapper')];
            if (rows.length <= count) return;
            rows.slice(count).forEach(row => {
                const removeBtn = row.querySelector('[data-action="removeChapter"]');
                if (removeBtn) removeBtn.click();
                else row.remove();
            });
            await waitForRowCount(count, 1200);
        };

        const waitForStableRowCount = async (count, timeout = timing.waitTimeout, stableMs = timing.stableMs) => {
            const start = Date.now();
            let stableStart = null;
            while (Date.now() - start < timeout) {
                const current = getRowCount();
                if (current === count) {
                    if (stableStart == null) stableStart = Date.now();
                    if (Date.now() - stableStart >= stableMs) return true;
                } else {
                    stableStart = null;
                }
                await sleep(80);
            }
            return false;
        };

        const tryGenerateByNumInput = async () => {
            if (!numFileInput) return false;
            numFileInput.value = String(targetCount);
            numFileInput.dispatchEvent(new Event('input', { bubbles: true }));
            numFileInput.dispatchEvent(new Event('change', { bubbles: true }));
            return waitForStableRowCount(targetCount, timing.waitTimeout, timing.stableMs);
        };

        const ensureRows = async () => {
            let ok = false;
            if (numFileInput) {
                ok = await tryGenerateByNumInput();
            }
            if (!ok) {
                let current = getRowCount();
                if (current > targetCount) {
                    await trimExtraRows(targetCount);
                    current = getRowCount();
                }
                const toAdd = Math.max(0, targetCount - current);
                for (let i = 0; i < toAdd; i += 1) {
                    addChapterBtn.click();
                    if (timing.clickDelay && (i + 1) % 10 === 0) {
                        await sleep(timing.clickDelay);
                    }
                }
                ok = await waitForStableRowCount(targetCount, timing.waitTimeout, timing.stableMs);
            }
            return ok;
        };

        const existingRows = getRowCount();
        if (targetCount > 0 && existingRows > 0) {
            await resetChapterRows();
        }

        const rowsReady = await ensureRows();
        const currentCount = getRowCount();
        const fillCount = Math.min(targetCount, currentCount);
        if (!rowsReady || currentCount !== targetCount) {
            log(`⚠️ Số hàng nhập liệu (${currentCount}) chưa khớp số file (${targetCount}).`, 'warn');
        }

        if (numFileInput) {
            const desired = String(fillCount);
            if (numFileInput.value !== desired) {
                numFileInput.value = desired;
                numFileInput.dispatchEvent(new Event('input', { bubbles: true }));
                numFileInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            log('✅ Đã cập nhật ô "Số file".');
        } else {
            log('⚠️ Không tìm thấy ô "Số file".', 'warn');
        }

        const autoNumberCheckbox = trueWrapper.querySelector('input[name="autoNumber"]');
        if (autoNumberCheckbox && autoNumberCheckbox.checked) {
            autoNumberCheckbox.click();
            log('✅ Đã tắt "Đánh số tự động".');
        }

        log(`✅ Đã tạo ${fillCount} hàng nhập liệu.`);

        await sleep(timing.settleMs);


        const buildChapterName = (item) => {
            if (item.chapterNumber != null) {
                const titleFromName = (typeof item.rawTitle === 'string') ? item.rawTitle.trim() : item.file.name.replace(/\.txt$/i, '').trim();
                const tpl = settings.CHAPTER_NAME_TEMPLATE || '第{num}章 {title}';
                return applyTemplate(tpl, item.chapterNumber, titleFromName).trim();
            }
            const directTitle = (typeof item.rawTitle === 'string') ? item.rawTitle.trim() : '';
            return directTitle || item.file.name.replace(/\.txt$/i, '');
        };

        const chapterRows = chapterWrapperContainer.querySelectorAll('.chapter-info-wrapper');
        let assignmentErrorCount = 0;
        for (let idx = 0; idx < fillCount; idx += 1) {
            const item = mergedFiles[idx];
            const row = chapterRows[idx];
            if (!row) {
                log(`Lỗi: Hàng ${idx + 1} không tồn tại!`, 'error');
                assignmentErrorCount += 1;
                continue;
            }

            const file = item.file;
            const nameInput = row.querySelector('input[name="name"]');
            const fileTextInput = row.querySelector('input.file-path');
            const fileInputReal = row.querySelector('input[type="file"][name="file"], input[name="file"][type="file"]') || row.querySelector('input[type="file"]');

            const chapterName = buildChapterName(item);

            if (nameInput) {
                nameInput.value = chapterName;
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                nameInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (fileTextInput) {
                fileTextInput.value = file.name;
                fileTextInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            try {
                const dt = new DataTransfer();
                dt.items.add(file);
                if (fileInputReal) {
                    fileInputReal.files = dt.files;

                    fileInputReal.dispatchEvent(new Event('input', { bubbles: true }));
                    fileInputReal.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    log(`❌ Không tìm thấy input file ở hàng ${idx + 1}`, 'error');
                    assignmentErrorCount += 1;
                }
            } catch (e) {
                log(`Lỗi khi gán file: ${e.message}`, 'error');
                assignmentErrorCount += 1;
            }

            if (timing.clickDelay && idx > 0 && idx % 20 === 0) {
                await sleep(0);
            }
            log(`...Đã gán file \"${file.name}\" vào hàng ${idx + 1}`);
        }

        if (window.M && typeof window.M.updateTextFields === 'function') {
            try { window.M.updateTextFields(); } catch { }
        }
        await sleep(timing.verifyMs);
        const verifyRows = chapterWrapperContainer.querySelectorAll('.chapter-info-wrapper');
        let missingNameCount = 0;
        let missingFileCount = 0;
        for (let idx = 0; idx < fillCount; idx += 1) {
            const item = mergedFiles[idx];
            const row = verifyRows[idx];
            if (!row) continue;
            const nameInput = row.querySelector('input[name="name"]');
            const fileTextInput = row.querySelector('input.file-path');
            if (nameInput && !nameInput.value.trim()) {
                const chapterName = buildChapterName(item);
                nameInput.value = chapterName;
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                if (!nameInput.value.trim()) missingNameCount += 1;
            }

            const fileInputReal2 =
                row.querySelector('input[type="file"][name="file"], input[name="file"][type="file"]') ||
                row.querySelector('input[type="file"]');

            if (fileTextInput && !fileTextInput.value.trim()) {
                fileTextInput.value = item.file.name;
                fileTextInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            if (fileInputReal2 && (!fileInputReal2.files || fileInputReal2.files.length < 1)) {
                try {
                    const dt2 = new DataTransfer();
                    dt2.items.add(item.file);
                    fileInputReal2.files = dt2.files;
                    fileInputReal2.dispatchEvent(new Event('input', { bubbles: true }));
                    fileInputReal2.dispatchEvent(new Event('change', { bubbles: true }));
                    if (!fileInputReal2.files || fileInputReal2.files.length < 1) {
                        missingFileCount += 1;
                    }
                } catch (e) {
                    log(`❌ Verify gán lại file lỗi ở hàng ${idx + 1}: ${e.message}`, 'error');
                }
            }

        }
        if (missingNameCount || missingFileCount || assignmentErrorCount) {
            log(`⚠️ Đã bù lại ${missingNameCount} tên chương và ${missingFileCount} file bị trống.`, 'warn');
            if (assignmentErrorCount) {
                log(`⚠️ Có ${assignmentErrorCount} hàng gán lỗi, cần kiểm tra lại trước khi upload.`, 'warn');
            }
            showUploadToast('Đã gán xong, nhưng còn hàng trống cần kiểm tra lại.', 'error', 3600);
        } else {
            showUploadToast('Đã gán xong tên chương + file vào web.', 'success', 2800);
        }

        log('🎉 Hoàn tất! Tất cả các file đã sẵn sàng để tải lên.', 'success');
        fakeUploadBtn.disabled = false;
        log("✔ Sẵn sàng để Upload. Nút Tải lên đã được bật!", "success");

        // Nhắc lại file nhỏ nếu user đã bỏ qua cảnh báo
        if (state.smallFileNames && state.smallFileNames.length > 0) {
            log(`⚠️ Nhắc lại: Các file sau có dung lượng dưới ${settings.FILE_SIZE_WARNING_KB}KB, vui lòng kiểm tra lại: ${state.smallFileNames.join(', ')}`, 'warn');
        }


        fileInput.value = "";
    }

    // --- Khởi động script ---
    if (state.isEditPage || state.isNewBookPage) {
        hidePanel();
        floatingIconEl.addEventListener('pointerdown', (e) => {
            iconDragged = false;
            const startX = e.clientX;
            const startY = e.clientY;
            const onMove = (ev) => {
                if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) {
                    iconDragged = true;
                    floatingIconEl.removeEventListener('pointermove', onMove);
                }
            };
            floatingIconEl.addEventListener('pointermove', onMove);
            floatingIconEl.addEventListener('pointerup', () => {
                floatingIconEl.removeEventListener('pointermove', onMove);
            }, { once: true });
        });
        floatingIconEl.addEventListener('click', () => {
            if (iconDragged) return;
            showPanel();
        });
        minimizeBtn.addEventListener('click', hidePanel);
        helpBtn.addEventListener('click', openHelpModalFull);
        helpCloseBtn.addEventListener('click', closeHelpModal);
        uploadBtn.addEventListener('click', () => {
            if (!ensureSelectedVolumeValid()) return;
            fileInput.click();
        });
        if (addVolumeBtn) addVolumeBtn.addEventListener('click', addNewVolumeAndSelect);
        if (deleteVolumeBtn) deleteVolumeBtn.addEventListener('click', openDeleteConfirm);
        if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeDeleteConfirm);
        if (confirmOverlay) confirmOverlay.addEventListener('click', closeDeleteConfirm);
        if (confirmOkBtn) confirmOkBtn.addEventListener('click', confirmDeleteVolume);
        if (prefEnableBtn) prefEnableBtn.addEventListener('click', () => {
            setVolumeStatsEnabled(true);
            closeVolumeStatsPref();
        });
        if (prefDisableBtn) prefDisableBtn.addEventListener('click', () => {
            setVolumeStatsEnabled(false);
            closeVolumeStatsPref();
        });
        if (themePrefLightBtn) themePrefLightBtn.addEventListener('click', () => {
            setThemeMode('light');
            closeThemePref();
            maybeShowVolumeStatsPref();
        });
        if (themePrefDarkBtn) themePrefDarkBtn.addEventListener('click', () => {
            setThemeMode('dark');
            closeThemePref();
            maybeShowVolumeStatsPref();
        });
        if (themePrefAutoBtn) themePrefAutoBtn.addEventListener('click', () => {
            setThemeMode('auto');
            closeThemePref();
            maybeShowVolumeStatsPref();
        });
        fileInput.addEventListener('change', handleFileSelect);
        volumeSelect.addEventListener('change', handleVolumeChange);
        volumeSelect.addEventListener('mousedown', () => {
            state._prevSelectValue = volumeSelect.value;
            rebuildVolumeOptions('preserve');
        });

        let initialFormValues = {};


        function getFormValues() {
            return {
                logMax: logMaxInput.value,
                fileKb: fileSizeKbInput.value,
                theme: themeSelect ? themeSelect.value : '',
                firstLineOnly: firstLineOnlyInput.checked,
                priority: prioritySelect.value,
                chapTemplate: chapterTemplateInput.value,
                volumeStats: volumeStatsCheckbox ? volumeStatsCheckbox.checked : null
            };
        }

        function showSettingsModal() {

            logMaxInput.value = settings.LOG_MAX_LINES;
            fileSizeKbInput.value = settings.FILE_SIZE_WARNING_KB;
            if (themeSelect) {
                themeSelect.value = settings.THEME_MODE || DEFAULT_THEME_MODE;
            }
            firstLineOnlyInput.checked = !!settings.USE_FIRST_LINE_ONLY;
            prioritySelect.value = settings.PARSE_PRIORITY || 'filename';
            chapterTemplateInput.value = settings.CHAPTER_NAME_TEMPLATE;
            if (volumeStatsCheckbox) {
                volumeStatsCheckbox.checked = state.volumeStatsEnabled === true;
            }
            if (state.volumeStatsData && typeof state.volumeStatsData.total !== 'undefined') {
                updateTotalChaptersDisplay(state.volumeStatsData.total);
            } else {
                updateTotalChaptersDisplay(null);
            }

            setParseControlsEnabled(!firstLineOnlyInput.checked);
            initialFormValues = getFormValues();
            settingsOverlay.classList.remove(`${APP_PREFIX}hide`);
            settingsModal.classList.remove(`${APP_PREFIX}hide`);
        }

        function hideSettingsModal() {
            settingsOverlay.classList.add(`${APP_PREFIX}hide`);
            settingsModal.classList.add(`${APP_PREFIX}hide`);
        }
        async function tryCloseSettingsModal() {
            const currentValues = getFormValues();
            if (JSON.stringify(currentValues) !== JSON.stringify(initialFormValues)) {
                const shouldClose = await showUiConfirm(
                    'Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy không?',
                    'Hủy thay đổi',
                    'Bỏ thay đổi',
                    'Tiếp tục chỉnh'
                );
                if (!shouldClose) {
                    return;
                }
            }
            hideSettingsModal();
        }

        settingsBtn.addEventListener('click', showSettingsModal);
        settingsCancelBtn.addEventListener('click', tryCloseSettingsModal);
        firstLineOnlyInput.addEventListener('change', () => {
            setParseControlsEnabled(!firstLineOnlyInput.checked);
        });
        settingsSaveBtn.addEventListener('click', async () => {
            const newLogMax = parseInt(logMaxInput.value, 10);
            const newFileKb = parseInt(fileSizeKbInput.value, 10);
            const newChapTpl = chapterTemplateInput.value.trim() || '第{num}章 {title}';
            const useFirstLineOnly = firstLineOnlyInput.checked;


            if (!useFirstLineOnly && !newChapTpl.includes('{num}')) {
                await showUiAlert('Template phải chứa {num}.', 'Lỗi cài đặt');
                return;
            }


            if (isNaN(newLogMax) || newLogMax <= 0) {
                await showUiAlert('Số dòng log phải là số dương.', 'Lỗi cài đặt');
                return;
            }
            if (isNaN(newFileKb) || newFileKb < 0) {

                await showUiAlert('Kích thước file (KB) phải là số không âm (0 hoặc lớn hơn).', 'Lỗi cài đặt');
                return;
            }

            settings.LOG_MAX_LINES = newLogMax;
            settings.FILE_SIZE_WARNING_KB = newFileKb;
            settings.USE_FIRST_LINE_ONLY = useFirstLineOnly;
            settings.CHAPTER_NAME_TEMPLATE = newChapTpl;

            settings.PARSE_PRIORITY = prioritySelect.value;
            if (themeSelect) {
                settings.THEME_MODE = themeSelect.value || DEFAULT_THEME_MODE;
            }

            saveSettings();
            applyTheme(settings.THEME_MODE);
            initialFormValues = getFormValues();
            hideSettingsModal();
            if (volumeStatsCheckbox) {
                setVolumeStatsEnabled(volumeStatsCheckbox.checked);
            }
            log('Cài đặt đã được cập nhật.');
        });


        setTimeout(() => {
            const storedVer = GM_getValue(VERSION_KEY, null);
            if (!storedVer) {
                openHelpModalFull();
                GM_setValue(VERSION_KEY, CURRENT_VERSION);
                return;
            }
            if (storedVer !== CURRENT_VERSION) {
                openHelpModalUpdateOnly();
                GM_setValue(VERSION_KEY, CURRENT_VERSION);
            }
        }, 1200);

        initialize();
        if (state.volumeStatsEnabled === true) {
            loadVolumeStats(false);
        }
        setTimeout(() => {
            maybeShowThemePref();
        }, 1600);
    }
})();
