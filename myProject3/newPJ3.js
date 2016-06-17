
var VSHADER_SOURCE1 = 'attribute vec4 a_Position;\n' + 
	'uniform mat4 u_MvpMatrix;\n' + 
	'attribute vec2 a_TexC;\n' + 
	'varying vec2 V_TexC;\n' + 
	'void main() {\n' + 
	'gl_Position = u_MvpMatrix * a_Position;\n' + 
	'V_TexC = a_TexC;\n' + 
	'}\n';
var FSHDER_SOURCE1 =  '#ifdef GL_ES\n' + 
	'precision mediump float;\n' + 
	'#endif\n' + 
	'uniform sampler2D u_Sampler;\n' + 
	'varying vec2 V_TexC;\n' +
	'void main() {\n' + 
	'gl_FragColor = texture2D(u_Sampler, V_TexC);\n' + 
	'}\n';
var VSHADER_M_SOURCE = 'attribute vec4 a_Position;\n' + 
	'attribute vec4 a_Color;\n' + 
	'attribute vec4 a_Normal;\n' + 
	'uniform mat4 u_MvpMatrix;\n' + 
	'uniform mat4 u_NormalMatrix;\n' + 
	'uniform vec3 u_AmbientLight;\n' + 
	'uniform vec3 u_DirectionLight;\n' + 
	'uniform mat4 u_ModelMatrix;\n' + 
	'uniform vec3 u_PointLightColor;\n' + 
	'uniform vec3 u_PointLightPosition;\n' + 
	'varying vec4 v_Color; \n' + 
	'void main() {\n' + 
	'gl_Position = u_MvpMatrix * a_Position;\n' + 
	'vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' + 
	'float NDL = max(dot(normal, u_DirectionLight), 0.0);\n' + 
	'vec3 diffuse = a_Color.rgb * NDL;\n' + 
	'vec4 vertexPosition = u_ModelMatrix * a_Position;\n' + 
	'vec3 lightDirection = normalize(u_PointLightPosition-vec3(vertexPosition));\n' + 
	'float NDL2 = max(dot(normal, lightDirection), 0.0);\n' + 
	'vec3 diffuse2 = u_PointLightColor * a_Color.rgb * NDL2;\n' + 
	'vec3 ambient = u_AmbientLight * a_Color.rgb;\n' + 
	'v_Color = vec4(ambient+diffuse+diffuse2 , a_Color.a);\n' + 
	'}\n';
var FSHADER_M_SOURCE = '#ifdef GL_ES\n' + 
	'precision mediump float;\n' + 
	'#endif\n' + 
	'varying vec4 v_Color;\n' + 
	' void main() {\n' + 
	'gl_FragColor = v_Color;\n' + 
	'}\n';

var VSHADER_SHOURCE3 = 'attribute vec4 a_Position;\n' + 
	'attribute vec4 a_Color;\n' + 
	'attribute vec4 a_Normal;\n' + 
	'uniform mat4 u_MvpMatrix;\n' + 
	'uniform mat4 u_NormalMatrix;\n' + 
	'varying vec4 v_Color;\n' +
	'void main() {\n' + 
	'vec3 lightDirection = vec3(-0.35, 0.35, 0.87);\n' + 
	'gl_Position = u_MvpMatrix * a_Position;\n' + 
	'vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' + 
	'float NDL = max(dot(normal, lightDirection), 0.0);\n' + 
	' v_Color = vec4(a_Color.rgb * NDL, a_Color.a) +vec4(0.2,0.2,0.2,1.0);\n' + 
	'}\n';
var FSHADER_SHOURCE3 = '#ifdef GL_ES\n' + 
	'precision mediump float;\n' + 
	'#endif\n' + 
	'varying vec4 v_Color;\n' + 
	'void main() {\n' + 
	'gl_FragColor = v_Color;\n' + 
	'}\n';


function printMessage(message){
	var mb = document.getElementById("messageBox");
		mb.innerHTML = "message:\n"+ message;
		mb.style.fontFamily="Open Sans"; 
		mb.style.color="red";
}

var canvas;
var gl;
var Program1;
var LightProgram2;
var LightProgram3;
var requestTick;
var Rot = 0.0;
var OBJScList = [];
var OBJScList2 = [];
var SceneObject = function() {
		this.model;
		this.filePath;
		this.objDoc;
		this.drawingInfo;
		this.transform;
		this.valid = 0;
	};


function onReadOBJFile(fileString, so, gl, scale, reverse) {
  var objDoc = new OBJDoc(so.filePath);  // Create a OBJDoc object
  objDoc.defaultColor = so.color;
  var result = objDoc.parse(fileString, scale, reverse); // Parse the file
  if (!result) {
    so.objDoc = null; so.drawingInfo = null;
    console.log("OBJ file parsing error.");
    return;
  }
  so.objDoc = objDoc;
}

function readOBJFile(so, gl, scale, reverse) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) {
      onReadOBJFile(request.responseText, so, gl, scale, reverse);
    }
  }
  request.open('GET', so.objFilePath, true); // Create a request to acquire the file
  request.send();                      // Send the request
}

function onReadComplete(gl, model, objDoc) {
  // Acquire the vertex coordinates and colors from OBJ file
  var drawingInfo = objDoc.getDrawingInfo();

  gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

  return drawingInfo;
}

function createEmptyArrayBuffer(gl, a_attribute, num, type) {
  var buffer =  gl.createBuffer();  // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

  //在buffer中填入type和element数量信息，以备之后绘制过程中绑定shader使用
  buffer.num = num;
  buffer.type = type;
  
  return buffer;
}

function initVertexBuffers(gl, program) {
  var obj = new Object(); // Utilize Object object to return multiple buffer objects
  obj.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT); 
  obj.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
  obj.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
  obj.indexBuffer = gl.createBuffer();
  if (!obj.vertexBuffer || !obj.normalBuffer || !obj.colorBuffer || !obj.indexBuffer) { return null; }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return obj;
}
var ElapsedDate = null;
function getElapsed() {
	if (ElapsedDate == null) {
		ElapsedDate = Date.now();
		return 0.0
	};
	var DN = Date.now();
	var DE = DN - ElapsedDate;
	ElapsedDate = DN;
	return DE
};
var MessageD = '';

function formatVec3Str(D, L) {
	return formatVec3StrFix(D, L, 3)
};

function formatVec3StrFix(Dire, List, n) {
	return ' ' + Dire + ' : ' + List.elements[0].toFixed(n) + ' , ' + 
	List.elements[1].toFixed(n) + ' , ' + List.elements[2].toFixed(n)
};


var Eyes = new Vector3(CameraPara.eye);
var lookAt = new Vector3(CameraPara.at);
var Upforw = new Vector3(CameraPara.up);
var CameraX = {
	up: 0,
	down: 0,
	left: 0,
	right: 0,
	forward: 0,
	back: 0,
	leftRot: 0,
	RightRot: 0,
	flashlight: 0
};
var FloorTexture = {
	texId: -1,
	valid: 0
};
var BoxTexture = {
	texId: -1,
	valid: 0
};
function Calculate(Move_V, Rot_V) {
	var Rot_D = Rot_V * Math.PI / 180.0;
	if (CameraX.forward || CameraX.back) {
		var C_Vic = CameraX.forward ? VectorMinus(lookAt, Eyes) : VectorMinus(Eyes, lookAt);
		C_Vic.normalize();
		C_Vic = VectorMultNum(C_Vic, Move_V);
		lookAt = VectorAdd(lookAt, C_Vic);
		Eyes = VectorAdd(Eyes, C_Vic)
	};
	if (CameraX.right || CameraX.left) {
		var VM = VectorMinus(lookAt, Eyes);
		VM.normalize();
		var VC = VectorCross(VM, Upforw);
		VC.normalize();
		Upforw = VectorCross(VC, VM);
		Upforw.normalize();
		vt = CameraX.right ? VC : VectorReverse(VC);
		vt.normalize();
		vt = VectorMultNum(vt, Move_V);
		lookAt = VectorAdd(lookAt, vt);
		Eyes = VectorAdd(Eyes, vt)
	};
	if (CameraX.rightRot || CameraX.leftRot) {
		var Element = lookAt.elements[1];
		var VM = VectorMinus(lookAt, Eyes);
		VM.normalize();
		var VC = VectorCross(VM, Upforw);
		VC.normalize();
		Upforw = VectorCross(VC, VM);
		Upforw.normalize();
		var VMN = VectorMultNum(CameraX.rightRot ? VC : VectorReverse(VC), Math.tan(Rot_D));
		VMN = VectorAdd(VM, VMN);
		VMN.normalize();
		lookAt = VectorAdd(Eyes, VMN)
	};
	if (CameraX.up || CameraX.down) {
		var VM = VectorMinus(lookAt, Eyes);
		VM.normalize();
		var VC = VectorCross(VM, Upforw);
		VC.normalize();
		Upforw = VectorCross(VC, VM);
		Upforw.normalize();
		var VMN;
		if (CameraX.up) VMN = VectorMultNum(Upforw, Math.tan(Rot_D));
		else VMN = VectorMultNum(VectorReverse(Upforw), Math.tan(Rot_D));
		VMN = VectorAdd(VM, VMN);
		VMN.normalize();
		lookAt = VectorAdd(Eyes, VMN)
	}
};


function initAttribV(gl, a_, a_Buffer) {
	gl.bindBuffer(gl.ARRAY_BUFFER, a_Buffer);
	gl.vertexAttribPointer(a_, a_Buffer.num, a_Buffer.type, false, 0, 0);
	gl.enableVertexAttribArray(a_)
};

function bindTexture(arr_Buffer, index_Buffer) {
	if (arr_Buffer.valid) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, arr_Buffer.texId);
		gl.uniform1i(index_Buffer.u_Sampler, 0);
		return true
	};
	return false
};


function initElementBuffer(gl, UnitArr, Gbyte) {
	var Buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, UnitArr, gl.STATIC_DRAW);
	Buffer.type = Gbyte;
	return Buffer
};

function initArrayBuffer(gl, FArr, num, Gfloat) {
	var ArrBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, ArrBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, FArr, gl.STATIC_DRAW);
	ArrBuffer.num = num;
	ArrBuffer.type = Gfloat;
	return ArrBuffer
};

function initVertexBuffersForTexObj(gl, Res) {
	var VBuffers = new Object();
	VBuffers.vertexBuffer = initArrayBuffer(gl, new Float32Array(Res.vertex), 3, gl.FLOAT);
	VBuffers.texCoordBuffer = initArrayBuffer(gl, new Float32Array(Res.texCoord), 2, gl.FLOAT);
	var UnitArr = new Uint8Array(Res.index);
	VBuffers.indexBuffer = initElementBuffer(gl, UnitArr, gl.UNSIGNED_BYTE);
	if (!VBuffers.vertexBuffer || !VBuffers.texCoordBuffer || !VBuffers.indexBuffer) return null;
	VBuffers.numIndices = UnitArr.length;
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	return VBuffers
};

function loadTexture(Texture, img) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, Texture.texId);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
	Texture.valid = 1
};

function initTextures(Texture, path) {
	Texture.texId = gl.createTexture();
	var img = new Image();
	if (!img) {
		console.log('Failed to creste image obj');
		return false
	};
	img.onload = function() {
		loadTexture(Texture, img)
	};
	img.src = path;
	return true
};

function prepareTextures() {
	initTextures(FloorTexture, floorRes.texImagePath);
	initTextures(BoxTexture, boxRes.texImagePath);
	return true
};



function Down(e) {
	var code = e.keyCode ? e.keyCode : e.which;
	var updown = 1;
	ControL(code, updown)
};

function Up(e) {
	var code = e.keyCode ? e.keyCode : e.which;
	var updown = 0;
	ControL(code, updown)
};


function main() {
	canvas = document.getElementById('webgl');
	gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return
	};
	Program1 = createProgram(gl, VSHADER_SOURCE1, FSHDER_SOURCE1);
	LightProgram2 = createProgram(gl, VSHADER_SHOURCE3, FSHADER_SHOURCE3);
	LightProgram3 = createProgram(gl, VSHADER_M_SOURCE, FSHADER_M_SOURCE);
	Program1.a_Position = gl.getAttribLocation(Program1, 'a_Position');
	Program1.a_TexC = gl.getAttribLocation(Program1, 'a_TexC');
	Program1.u_MvpMatrix = gl.getUniformLocation(Program1, 'u_MvpMatrix');
	LightProgram2.a_Normal = gl.getAttribLocation(LightProgram2, 'a_Normal');
	LightProgram2.u_MvpMatrix = gl.getUniformLocation(LightProgram2, 'u_MvpMatrix');
	LightProgram2.u_NormalMatrix = gl.getUniformLocation(LightProgram2, 'u_NormalMatrix');
	Program1.u_Sampler = gl.getUniformLocation(Program1, 'u_Sampler');
	LightProgram2.a_Position = gl.getAttribLocation(LightProgram2, 'a_Position');
	LightProgram2.a_Color = gl.getAttribLocation(LightProgram2, 'a_Color');
	LightProgram3.a_Position = gl.getAttribLocation(LightProgram3, 'a_Position');
	LightProgram3.u_DirectionLight = gl.getUniformLocation(LightProgram3, 'u_DirectionLight');
	LightProgram3.u_ModelMatrix = gl.getUniformLocation(LightProgram3, 'u_ModelMatrix');
	LightProgram3.u_PointLightColor = gl.getUniformLocation(LightProgram3, 'u_PointLightColor');
	LightProgram3.u_PointLightPosition = gl.getUniformLocation(LightProgram3, 'u_PointLightPosition');
	LightProgram3.a_Color = gl.getAttribLocation(LightProgram3, 'a_Color');
	LightProgram3.a_Normal = gl.getAttribLocation(LightProgram3, 'a_Normal');
	LightProgram3.u_MvpMatrix = gl.getUniformLocation(LightProgram3, 'u_MvpMatrix');
	LightProgram3.u_NormalMatrix = gl.getUniformLocation(LightProgram3, 'u_NormalMatrix');
	LightProgram3.u_AmbientLight = gl.getUniformLocation(LightProgram3,'u_AmbientLight');
	prepareTextures();
	OBJScList = [];
	var VBuffer = initVertexBuffersForTexObj(gl, floorRes);
	VBuffer.texObj = FloorTexture;
	VBuffer.name = 'floor';
	VBuffer.translate = floorRes.translate;
	VBuffer.scale = floorRes.scale;
	OBJScList.push(VBuffer);
	VBuffer = initVertexBuffersForTexObj(gl, boxRes);
	VBuffer.texObj = BoxTexture;
	VBuffer.name = 'box';
	VBuffer.translate = boxRes.translate;
	VBuffer.scale = boxRes.scale;
	OBJScList.push(VBuffer);

	for (var i= 0; i < ObjectList.length; i++) {
		var OBJi = ObjectList[i];
		var ScObj = new SceneObject();
		ScObj.model = initVertexBuffers(gl, LightProgram3);
		if (!ScObj.model) {
			console.log('Failed to set information');
			ScObj.valid = 0;
			continue
		};
		ScObj.valid = 1;
		ScObj.objFilePath = OBJi.objFilePath;
		ScObj.color = OBJi.color;
		if (ScObj.color.length == 3) {
			ScObj.color.push(1.0)
		};
		ScObj.kads= OBJi.kads;
		ScObj.transform = OBJi.transform;
		readOBJFile(ScObj, gl, 1.0, true);
		OBJScList2.push(ScObj)
	};
	document.onkeydown = function(OBJi) {
		Down(OBJi)
	};
	document.onkeyup = function(OBJi) {
		Up(OBJi)
	};
	var tick = function() {
			Render();
			requestTick = requestAnimationFrame(tick, canvas);
		};
	tick()
}
function Render() {
	gl.useProgram(Program1);
	MessageD = '';
	var Elap = getElapsed();
	var MVE = (MOVE_VELOCITY * Elap) / 1000.0;
	var RVE = (ROT_VELOCITY * Elap) / 1000.0;
	Calculate(MVE, RVE);
	MessageD += formatVec3StrFix('<br/> position ', Eyes, 1);
	MessageD += formatVec3StrFix('<br/> look at ', lookAt, 1);
	printMessage(MessageD);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	var Mmodel = new Matrix4();
	var Mview = new Matrix4();
	var MProj = new Matrix4();
	var Mmvp = new Matrix4();
	var Mnormal = new Matrix4();
	Mview.setLookAt(Eyes.elements[0], Eyes.elements[1], Eyes.elements[2], lookAt.elements[0], lookAt.elements[1], 
		lookAt.elements[2], Upforw.elements[0], Upforw.elements[1], Upforw.elements[0x2]);
	MProj.setPerspective(CameraPara.fov, canvas.width / canvas.height, CameraPara.near, CameraPara.far);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	var n = 0;
	for (n = 0; n < OBJScList.length; n++) {
		var so = OBJScList[n];
		Mmodel.setIdentity();
		Mmodel.translate(so.translate[0], so.translate[1], so.translate[2]);
		Mmodel.scale(so.scale[0], so.scale[1], so.scale[2]);
		Mmvp.set(MProj).multiply(Mview).multiply(Mmodel);
		gl.uniformMatrix4fv(Program1.u_MvpMatrix, false, Mmvp.elements);
		initAttribV(gl, Program1.a_Position, so.vertexBuffer);
		initAttribV(gl, Program1.a_TexC, so.texCoordBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,so.indexBuffer);
		if (bindTexture(so.texObj, Program1)) {
			gl.drawElements(gl.TRIANGLES, so.numIndices, so.indexBuffer.type, 0)
		} else {
			continue
		}
	};
	gl.useProgram(LightProgram3);
	gl.uniform3f(LightProgram3.u_AmbientLight, sceneAmbientLight[0], sceneAmbientLight[1], sceneAmbientLight[2]);
	gl.uniform3f(LightProgram3.u_DirectionLight, sceneDirectionLight[0], sceneDirectionLight[1], sceneDirectionLight[2]);
	if (CameraX.flashlight) {
		gl.uniform3f(LightProgram3.u_PointLightColor, scenePointLightColor[0], scenePointLightColor[1], scenePointLightColor[2])
	} else {
		gl.uniform3f(LightProgram3.u_PointLightColor, 0.0, 0.0, 0.0)
	};
	gl.uniform3f(LightProgram3.u_PointLightPosition, Eyes.elements[0], Eyes.elements[1], Eyes.elements[2]);
	for (n = 0; n < OBJScList2.length; n++) {
		var so = OBJScList2[n];
		if (so.objDoc != null && so.objDoc.isMTLComplete()) {
			so.drawingInfo = onReadComplete(gl, so.model, so.objDoc);
			OBJScList2[n].objname = so.objDoc.objects[0].name;
			so.objname = so.objDoc.objects[0].name;
			so.objDoc = null
		};
		if (so.drawingInfo) {
			Mmodel.setIdentity();
			if (so.objname == 'moon') {
				for (var j = 0; j < so.transform.length; j++) {
					var trans = so.transform[j];
					if (trans.type == 'rotate') {
						Mmodel.rotate(trans.content[0], trans.content[1], trans.content[2], trans.content[3])
					} else if (trans.type == 'scale') {
						Mmodel.scale(trans.content[0], trans.content[1], trans.content[2])
					}
				}

				var l = (20 * Elap) / 2000.0;
				Rot = (Rot + l) % 360.0;
				var rl = Rot * Math.PI / 180.0;
				Mmodel.translate(13.0 * Math.cos(rl), 6.0 + 1.5 * Math.sin(rl * 2), 13.0 * Math.sin(rl));

			}else if (so.objname == 'bird') {
				var l = (100 * Elap) / 2000.0;
				Rot = (Rot + l) % 360.0;
				var rl = Rot * Math.PI / 180.0;
				Mmodel.translate(10.0 * Math.cos(rl), 4.0 + 1.5 * Math.sin(rl * 2), 10.0 * Math.sin(rl));
				Mmodel.rotate(Rot, 0.0, 1.0, 0.0);
				for (var j = 0; j < so.transform.length; j++) {
					var o = so.transform[j];
					if (o.type == 'scale') {
						Mmodel.scale(o.content[0], o.content[1], o.content[2])
					}
				}
			}
			 else {
				for (var j = 0; j < so.transform.length; j++) {
					var trans = so.transform[j];
					if (trans.type == 'translate') {
						Mmodel.translate(trans.content[0], trans.content[1], trans.content[2])
					} else if (trans.type == 'rotate') {
						Mmodel.rotate(trans.content[0], trans.content[1], trans.content[2], trans.content[3])
					} else if (trans.type == 'scale') {
						Mmodel.scale(trans.content[0], trans.content[1], trans.content[2])
					}
				}
			};
			gl.uniformMatrix4fv(LightProgram3.u_ModelMatrix, false, Mmodel.elements);
			Mmvp.set(MProj).multiply(Mview).multiply(Mmodel);
			gl.uniformMatrix4fv(LightProgram3.u_MvpMatrix, false, Mmvp.elements);
			Mnormal.setInverseOf(Mmodel);
			Mnormal.transpose();
			gl.uniformMatrix4fv(LightProgram3.u_NormalMatrix, false, Mnormal.elements);
			initAttribV(gl, LightProgram3.a_Position, so.model.vertexBuffer);
			initAttribV(gl, LightProgram3.a_Normal, so.model.normalBuffer);
			initAttribV(gl, LightProgram3.a_Color, so.model.colorBuffer);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, so.model.indexBuffer);
			gl.drawElements(gl.TRIANGLES, so.drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
		}
	}
};
function ControL(keycode, updown) {
	if (keycode == 73) {
		CameraX.up = updown
	} else if (keycode == 65) {
		CameraX.left = updown
	
	} else if (keycode == 68) {
		CameraX.right = updown
			} else if (keycode == 70) {
		CameraX.flashlight = updown
		} else if (keycode == 75) {
		CameraX.down = updown
			} else if (keycode == 74) {
		CameraX.leftRot = updown
	} else if (keycode == 76) {
		CameraX.rightRot = updown
			} else if (keycode == 87) {
		CameraX.forward = updown
	} else if (keycode == 83) {
		CameraX.back = updown
	} else {
		return
	}
};


