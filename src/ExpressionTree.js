// 의사 코드  or 파이썬 or c언어 상관 없습니다. 다만 주석을 꼭 달아주세요!
// 노드 클래스
class Node {
    //초기화
    constructor(data, id = Number(new Date()).toString(16)){
        this.id = id;
        this.info = data;
        this.children = [];
        this.parent = null;
        this.depth = 0;
    }
    getId(){return this.id;} //고유 id 반환
    getInfo(){return this.info;} //포함 정보 반환
    getChildren(){return this.children;} //자식 노드 반환
    getParent(){return this.parent;} //부모 노드 반환
    getDepth(){return this.depth;} //트리에 포함되어있다면 해당 트리에서의 깊이 반환
    merge(key, val){this[key] = val;} //지정 정보 수정
    //해당 노드를 포함하여 모든 후손 노드를 반환
    getPedigree(){
        const ret = [];
        const func = (e, ret) => {
            ret.push(e);
            ret.push(...e.getChildren().reduce((a,e)=>{
                if(e.getChildren().length > 0) {
                    func(e, ret);
                    return a;
                }
                else return [...a, e];
            },[]));
        }
        func(this, ret);
        return ret;
    }
}
// 트리 클래스
class Tree {
    constructor(Root){
        this.Root = Root;
        this.nodes = [Root];
    }
    getRoot(){return this.Root;} //루트 노드 반환
    getNodebyId(id){return this.nodes.find(e => e.getId() === id);} //id로 트리 내 노드 탐색
    getNodes(){return this.nodes;} //트리에 포함된 모든 노드 반환
    addChild(node1, node2){ //트리에 포함된 노드의 자식 노드로서 노드 추가
        if(node1.getChildren().includes(node2)) {
             console.log(node1, node2);
             return 0;
        }
        this.nodes.push(node2);
        node2.merge("parent", node1);
        node2.merge("depth", node1.getDepth()+1);
        node1.merge("children", [...node1.getChildren(), node2]);
        return node2;
    }
    addChildatRoot(node) { //루트 노드에 자식 노드 추가
        node.depth = 1;
        node.parent = this.Root;
        this.Root.children.push(node);
        this.nodes.push(...node.getPedigree());

        return node;
    }
    removeChild(node1, node2){ //부모 노드의 지정된 자식 노드 삭제
        node2.parent = null;
        node2.depth = undefined;
        node1.children = node1.children.filter(e => e.getId() !== node2.getId());
        this.nodes = this.nodes.filter(e => e.getId() !== node2.getId())
    }

    exchangeChild(node1, node2){ //트리에 포함된 임의의 노드 치환
        if(!(node1 instanceof Node && node2 instanceof Node)) return 0;
        if(node1.getParent() !== null) node1.getParent().merge('children', node1.getParent().getChildren().map((e,i,a) => {return i === a.indexOf(node1) ? node2 : e}));
        node2.merge('parent', node1.getParent());
        node2.getPedigree().forEach(e => e.merge('depth', e.getDepth() + node1.getDepth()))
        
        const deleting = node1.getPedigree();
        const adding = node2.getPedigree();
        if(node1 === this.getRoot()) this.Root = node2;

        this.nodes = this.nodes.filter(e => !deleting.includes(e)).concat(adding);

        return node2;
    }

    getLeafNodes(){return this.getNodes().filter(e => !e.getChildren().length)}  // 리프 노드 반환
}

class ExpTree extends Tree { // 트리 클래스를 상속하여 편의 기능을 추가한 수식 트리 클래스
    inorderTraversal(){ //중위 순회
        const ret = [];
        const func = (e, ret) => {
            if(!(e instanceof Node)) return;
            if(e.getChildren().length > 0) {
                func(e.getChildren()[0], ret);
                ret.push(e);
                func(e.getChildren()[1], ret);
            }
            else ret.push(e);
        }
        func(this.getRoot(), ret);
        return ret;
    }
    concat(){ // 중위 순회를 기반으로 수식 트리의 정보를 조합한 문자열 반환
        return this.inorderTraversal().map(e => e.getInfo()).join('');
    }
}

// +, -를 기준으로 괄호를 하나의 객체로 취급하여 수식 트리 구성
function MakeTreeByPM(input){
    //문자열이 비었다면 오류 반환
    if(input.length === 0) return { Err : true, ErrMessage : "Void String" };
    const Exp = `(${input.match(/\S*/g).join("")})`;

    //수식에서 사용되는 영문자, 소괄호, 사칙연산 및 제곱 연산자와 숫자를 제외한 문자 포함시 오류 반환
    if(Exp.match(/[^0-9a-z+-/*-^().]/) !== null) return { Err : true, ErrMessage : "Unallowed character is included" }

    //괄호 단위로 묶어 상위에서는 괄호를 하나의 덩어리로 처리하고 하위에서는 해당하는 괄호에 대해서만 정의하여 각각의 스코프를 정의
    const Brackets = (() => {return  Exp.split("").map((e,i) => ((e === "(" || e === ")") - 2 * (e === ")")) * i).filter((e,i) => e !== 0 || i === 0)
    .reduce((a,e,_,k) => {
        const i = [k.indexOf(k.filter(e=>!a.includes(e)).find((e,i,a) => (e+0.5) * a[i+1] < 0)), k.indexOf(k.filter(e=>!a.includes(e)).find((e,i,a) => (e) * (a[i-1]+0.5) < 0))];
        if(_ === (Math.floor(k.length/2) + 1) && (a.length !== k.length || !(a.at(-1) === k.at(-1) && a.at(-2) === 0))) {k.splice(1); return []};
        return i[0] !== -1 ? [...a, ...i.map(e => k[e])] : a}, []);})()
    .reduce((a,e,i,k) => i % 2 ? a : [...a, [e, 0 - k[i+1]]], []);

    //괄호의 짝이 맞지 않거나, 닫히지 않은 괄호가 있다면 오류 반환
    if(!Brackets.length) return {Err : true, ErrMessage : "Brackets has incorrected"};
    
    const Scope = Brackets.map(e => Object({content : Exp.slice(e[0]+1, e[1]), start : e[0], end : e[1]})).sort((a,b) => a.start - b.start);
    
    //더하기와 빼기를 기준으로 수식을 분해하여 트리 구조로 재구성
    const mkExpTree = (content, index) => {
        //수식에서 더하기와 빼기의 순서를 유지한 위치 정보 배열
        const pm = content.split("").map((e,i) => [e, i]).filter((e,i) => (e[0] === '+' || e[0] === '-') 
								        && !Scope.some((E, j) => j !== index && E.start > Scope[index].start && E.end < Scope[index].end &&
                        E.start < (e[1]+1+Scope[index].start) && E.end > (e[1]+1+Scope[index].start)));

        //+-가 포함되어있지 않다면 노드가 한 개인 트리 반환
        if(pm.length === 0) return new ExpTree(new Node(content));
        else if(pm.length === 1 && pm[1] === 0) return new ExpTree(new Node(content));

        //각각의 위치를 기반으로 문자열을 두개로 분해한 구조들의 배열
        const separaters = pm.map((e,i,k) => {
            return [content.slice(i > 0 ? pm[i-1][1]+1 : 0, e[1]), e[0], content.slice(e[1]+1)];
        });
        
        const trees = [];
        
        //가장 뒤의 구조부터 배열을 트리로 재구성
        separaters.reverse().forEach((e,i,k) => {
            const addingTree = new ExpTree(new Node(e[1], i));
            addingTree.addChildatRoot(new Node(e[0]));
            addingTree.addChildatRoot(new Node(e[2]));
            trees.push(addingTree);
        })

        //각 트리의 중위 순회를 기반으로 한 각 노드의 정보 조합 문자열 변환
        const concats = trees.map(e => e.concat());

        //각각의 트리의 노드의 정보에 대하여 다른 임의의 트리의 조합 문자열과 일치한다면 해당 노드를 일치하는 트리의 루트 노드로 치환
        trees.forEach((e,i)=> {
            if(e.getNodes().some(e => concats.includes(e.getInfo()))){
                const changer = e.getNodes().map((e,i) => [concats.indexOf(e.getInfo()), i]).find(e => e[0]+1);
                e.exchangeChild(e.getNodes()[changer[1]], trees[changer[0]].getRoot())
            }
        })

        return trees.at(-1);
    }

    //각 스코프에 대해 모두 수식 구조로 변환
    const ret = Scope.map((e,i) => mkExpTree(e.content, i));

    return {Err : false, ErrMessage : "None", Res : ret};
}

//위와 기본적으로 동일하나 한 번 수식 구조로 변환된 트리의 리프 노드, 
//즉 이미 괄호 단위로 나뉘어진 각각의 스코프에 대해 처리하므로
//하나의 스코프에 대해서만 처리하며 +, -를 *, / 로 치환하여 동일하게 진행
function MakeTreeByMDwithPMTree(input) {
    if(input.length === 0) return { Err : true, ErrMessage : "Void String"};
    const Exp = `(${input.match(/\S*/g).join("")})`;
    if(Exp.match(/[^0-9a-z+-/*-^()!.]/) !== null) return { Err : true, ErrMessage : "Unallowed character is included" }

    const Brackets = (() => {return  Exp.split("").map((e,i) => ((e === "(" || e === ")") - 2 * (e === ")")) * i).filter((e,i) => e !== 0 || i === 0)
    .reduce((a,e,_,k) => {
        const i = [k.indexOf(k.filter(e=>!a.includes(e)).find((e,i,a) => (e+0.5) * a[i+1] < 0)), k.indexOf(k.filter(e=>!a.includes(e)).find((e,i,a) => (e) * (a[i-1]+0.5) < 0))]; 
        if(_ === (Math.floor(k.length/2) + 1) && (a.length !== k.length || !(a.at(-1) === k.at(-1) && a.at(-2) === 0))) {k.splice(1); return []};
        return i[0] !== -1 ? [...a, ...i.map(e => k[e])] : a}, []);})()
    .reduce((a,e,i,k) => i % 2 ? a : [...a, [e, 0 - k[i+1]]], []);

    if(!Brackets.length) return {Err : true, ErrMessage : "Brackets has incorrected"};
    
    const Scope = Brackets.map(e => Object({content : Exp.slice(e[0]+1, e[1]), start : e[0], end : e[1]})).sort((a,b) => a.start - b.start);
    
    const mkExpTree = (content, index) => {
        const pm = content.split("").map((e,i) => [e, i]).filter((e,i) => (e[0] === '*' || e[0] === '/') && 
								        !Scope.some((E, j) => j !== index && E.start > Scope[index].start && E.end < Scope[index].end && 
                        E.start < (e[1]+1+Scope[index].start) && E.end > (e[1]+1+Scope[index].start)));
        if(pm.length === 0) return new ExpTree(new Node(content));

        const separaters = pm.map((e,i,k) => {
            return [content.slice(i > 0 ? pm[i-1][1]+1 : 0, e[1]), e[0], content.slice(e[1]+1)];
        });
        
        const trees = [];
        separaters.reverse().forEach((e,i,k) => {
            const addingTree = new ExpTree(new Node(e[1], i));
            addingTree.addChildatRoot(new Node(e[0]));
            addingTree.addChildatRoot(new Node(e[2]));
            trees.push(addingTree);
        })

        const concats = trees.map(e => e.concat());

        trees.forEach((e,i)=> {
            if(e.getNodes().some(e => concats.includes(e.getInfo()))){
                const changer = e.getNodes().map((e,i) => [concats.indexOf(e.getInfo()), i]).find(e => e[0]+1);
                e.exchangeChild(e.getNodes()[changer[1]], trees[changer[0]].getRoot());
            }
        });

        return trees.at(-1);
    }
    
    const ret = mkExpTree(Scope[0].content, 0);
    if(ret.getNodes().some(e => e.getInfo() === "")) return {Err : true, ErrMessage :"Void String"};

    return {Err : false, ErrMessage : "None", Res : ret};
}

//위와 동일하며 *, /를 ^로 치환
function MakeTreeByPowerwithMDTree(input) {
    if(input.length === 0) return { Err : true, ErrMessage : "Void String" };
    const Exp = `(${input.match(/\S*/g).join("")})`;
    if(Exp.match(/[^0-9a-z+-/*-^()!.]/) !== null) return { Err : true, ErrMessage : "Unallowed character is included" }

    const Brackets = (() => {return  Exp.split("").map((e,i) => ((e === "(" || e === ")") - 2 * (e === ")")) * i).filter((e,i) => e !== 0 || i === 0)
    .reduce((a,e,_,k) => {
        const i = [k.indexOf(k.filter(e=>!a.includes(e)).find((e,i,a) => (e+0.5) * a[i+1] < 0)), k.indexOf(k.filter(e=>!a.includes(e)).find((e,i,a) => (e) * (a[i-1]+0.5) < 0))]; 
        if(_ === (Math.floor(k.length/2) + 1) && (a.length !== k.length || !(a.at(-1) === k.at(-1) && a.at(-2) === 0))) {k.splice(1); return []};
        return i[0] !== -1 ? [...a, ...i.map(e => k[e])] : a}, []);})()
    .reduce((a,e,i,k) => i % 2 ? a : [...a, [e, 0 - k[i+1]]], []);

    if(!Brackets.length) return {Err : true, ErrMessage : "Brackets has incorrected"};
    
    const Scope = Brackets.map(e => Object({content : Exp.slice(e[0]+1, e[1]), start : e[0], end : e[1]})).sort((a,b) => a.start - b.start);
    
    const mkExpTree = (content, index) => {
        const pm = content.split("").map((e,i) => [e, i]).filter((e,i) => (e[0] === '^') && !Scope.some((E, j) => j !== index && 
								        E.start > Scope[index].start && E.end < Scope[index].end && 
                        E.start < (e[1]+1+Scope[index].start) && E.end > (e[1]+1+Scope[index].start)));
        if(pm.length === 0) return new ExpTree(new Node(content));

        const separaters = pm.map((e,i,k) => {
            return [content.slice(i > 0 ? pm[i-1][1]+1 : 0, e[1]), e[0], content.slice(e[1]+1)];
        });

        const trees = [];
        separaters.reverse().forEach((e,i,k) => {
            const addingTree = new ExpTree(new Node(e[1], i));
            addingTree.addChildatRoot(new Node(e[0]));
            addingTree.addChildatRoot(new Node(e[2]));
            trees.push(addingTree);
        })
        const concats = trees.map(e => e.concat());
        trees.forEach((e,i)=> {
            if(e.getNodes().some(e => concats.includes(e.getInfo()))){
                const changer = e.getNodes().map((e,i) => [concats.indexOf(e.getInfo()), i]).find(e => e[0]+1);
                e.exchangeChild(e.getNodes()[changer[1]], trees[changer[0]].getRoot());
            }
        });
        return trees.at(-1);
    }
    
    const ret = mkExpTree(Scope[0].content, 0);
    if(ret.getNodes().some(e => e.getInfo() === "")) return {Err : true, ErrMessage :"Void String"};

    return {Err : false, ErrMessage : "None", Res : ret};
}

//위 3가지의 연산자 트리와 함수식을 포괄한 수식 트리 구성 
function MakeExpTree(input, functions){
    let ret;

    //+, -가 가장 마지막에 결합되어야 하므로 가장 먼저 분해
    const Check = MakeTreeByPM(input);

    //해당 과정에서 오류가 있었다면 해당 오류를 그대로 반환
    if(Check.Err) return {Err : true, ErrMessage : Check.ErrMessage};
    const PMTree = Check.Res;
     
    //그 전 *, /가 결합되어야 하므로 두번째로 분해
    ret = PMTree.reduce((a,e) => {
        return e.getLeafNodes().reduce((a,E) => {
            //console.log(E,) //MakeTreeByMDwithPMTree(E.getInfo()).Res);
            const md = MakeTreeByMDwithPMTree(E.getInfo());
            !md.Err && e.exchangeChild(E, md.Res.getRoot());
            if(md.Err) return md;
            return a;
        }, a);
    }, {Err : false, ErrMessage : "None"});
    //해당 과정에서 오류가 있었다면 해당 오류를 그대로 반환
    if(ret.Err) return {Err : true, ErrMessage : ret.ErrMessage};

    //그 전 ^가 결합되어야 하므로 세번째로 분해하여 기본적인 연산들에 대해 최종 분해
    ret = PMTree.reduce((a,e) => {
        return e.getLeafNodes().reduce((a,E) => {
            //console.log(E,) //MakeTreeByMDwithPMTree(E.getInfo()).Res);
            const pw = MakeTreeByPowerwithMDTree(E.getInfo());
            !pw.Err && e.exchangeChild(E, pw.Res.getRoot());
            if(pw.Err) return pw;
            return a;
        }, a);
    }, {Err : false, ErrMessage : "None"});
    //해당 과정에서 오류가 있었다면 해당 오류를 그대로 반환
    if(ret.Err) return {Err : true, ErrMessage : ret.ErrMessage};

    //정의된 함수들에 대한 치환 과정
    ret = PMTree.reduce((a, k,i,A)=>{
        //임의의 수식 트리의 리프노드에 대해 앞서 정의된 함수가 포함되어있다면 해당 함수로 치환하는 과정
        const func = (tree) => {
            //함수 포함 리프 노드 추출
            const includeFunc = tree.getLeafNodes().map(e => [e, e.getInfo().match(/^([a-z]+)\(.+\)$/)]).filter(e => e[1]).map(e => [e[0], e[1][1]]);
            console.log(includeFunc);
            //정의되지 않은 함수 호출 시 오류 반환
            if(includeFunc.some(e => !functions.map(e => Object.keys(e)[0]).includes(e[1]))) return {Err : true, ErrMessage : "Undefined Function is Included"};
            
            //함수 -> 수식 치환 과정
            const ret = includeFunc.reduce((a,e) => {
                //함수의 수식을 +-트리 구조로 재구성
                const Check = MakeTreeByPM( Object.values(functions.find(E => Object.keys(E)[0] === e[1]))[0]);
                //해당 과정에서 오류가 있었다면 오류를 그대로 반환
                if(Check.Err) return {Err : true, ErrMessage : Check.ErrMessage};
                const tempTree = Check.Res[0]; 
                let res;

                //리프노드를 */ 트리로 재구성
                res = tempTree.getLeafNodes().reduce((a,E) => {
                    const md = MakeTreeByMDwithPMTree(E.getInfo());
                    !md.Err && tempTree.exchangeChild(E, md.Res.getRoot());
                    if(md.Err) return md;
                    return a;
                }, {Err : false, ErrMessage : "None"});
                //해당 과정에서 오류가 있었다면 해당 오류를 그대로 반환
                if(res.Err) return res;

                //리프노드를 ^ 트리로 재구성
                res = tempTree.getLeafNodes().reduce((a,E) => {
                    const pw = MakeTreeByPowerwithMDTree(E.getInfo());
                    !pw.Err && tempTree.exchangeChild(E, pw.Res.getRoot());
                    return pw.Err ? pw : a;
                }, {Err : false, ErrMessage : "None"});
                if(res.Err) return res;

                //앞서 선언되지 않은 함수 사용 시 재귀 혹은 순환 구조가 만들어질 수 있으므로 이를 오류로 처리하여 반환
                if(tempTree.getLeafNodes().filter(e => e.getInfo().match(/^[a-z]+\(.+\)$/))
                    .some((E,i) => !functions.slice(0, functions.indexOf(E => Object.keys(E)[0] === e[1]))
                    .map(e => Object.keys(e)[0]).includes(E.getInfo().match(/^([a-z]+)\(.+\)$/) ? E.getInfo().match(/^([a-z]+)\(.+\)$/)[1] : ''))) 
                {
                    return {Err : true, ErrMessage : "Undefined Function is Included"};
                }

                //x를 함수에 전달된 인자로 치환하여 위에서 변환된 수식 구조로 치환
                let changer = e[0].getInfo().match(/^[a-z]+\((.+)\)$/)[1];
                if(changer.match(/^[a-z]+\(.+\)$/) === null) changer = `(${changer})`;
                tree.exchangeChild(e[0], tempTree.getRoot());
                tree.getLeafNodes().forEach(e => e.getInfo().match(/x/) !== null && tree.exchangeChild(e, new Node(e.getInfo().replace(/x/g,changer))));
                return a;
            }, {Err : false, ErrMessage : "None", Ret : 0});

            return {Err : ret.Err, ErrMessage : ret.ErrMessage, Ret : tree};
        }

        //리프 노드에 함수로 정의된 식이 없을 때까지 위 과정을 반복
        while(k.getLeafNodes().some(e => e.getInfo().match(/^[a-z]+\(.+\)$/) !== null)){
            const res = func(k);
            if(res.Err) return res;
        }
        return a;
    }, {Err : false, ErrMessage : "None"});
    //해당 과정에서 오류가 있었다면 해당 오류를 그대로 반환
    if(ret.Err) return {Err : true, ErrMessage : ret.ErrMessage};

    return {Err : false, ErrMessage : "None", Ret : PMTree};
}

function Expression(input, functions = []){
		//1차적인 수식 전개
    const retExpTree = MakeExpTree(input, functions);
    //해당 과정에서 오류가 있었다면 오류를 그대로 반환
    if(retExpTree.Err) {console.log(retExpTree.ErrMessage); return retExpTree.ErrMessage};
    const tree = retExpTree.Ret[0];

    //괄호가 포함된 영역이 없을 때까지 괄호 영역을 괄호를 제거한 뒤 수식 트리로 재구성하여 치환
    while(tree.getLeafNodes().some(e => e.getInfo().match(/^\(.+\)$/) !== null)) 
	    (tree.getLeafNodes().map(e => e.getInfo().match(/^\(.+\)$/) !== null ? tree.exchangeChild(e, MakeExpTree(e.getInfo().slice(1, e.getInfo(0).length-1), functions).Ret[0].getRoot()) : null));
    const max = Math.max(...tree.getNodes().map(e => e.getDepth()));

    //최하위 깊이의 노드들의 부모노드는 항상 연산자이므로 
    //최하위 깊이 노드의 부모 노드들에 대하여 부모 노드의 포함 연산자에 대해 
    //자식 노드를 피연산자로 하여 연산 결과를 정보로 갖는 노드로 치환
    //위 과정을 트리의 노드가 루트 노드만 남을때까지 반복
    for(let i = max; i >= 0; i--){
        tree.getNodes().filter(e => e.getDepth() === i).reduce((a,e) => !a.includes(e.getParent()) ? [...a, e.getParent()] : a, [])
        .forEach(e => {
            if(e === null) return;
            switch(e.getInfo()) {
                case '+' :
                    tree.exchangeChild(e, new Node(Number(e.getChildren()[0].getInfo()) + Number(e.getChildren()[1].getInfo())));
                    break;
                case '-' :
                    tree.exchangeChild(e, new Node(Number(e.getChildren()[0].getInfo()) - Number(e.getChildren()[1].getInfo())));
                    break;
                case '*' :
                    tree.exchangeChild(e, new Node(Number(e.getChildren()[0].getInfo()) * Number(e.getChildren()[1].getInfo())));
                    break;
                case '/' :
                    tree.exchangeChild(e, new Node(Number(e.getChildren()[0].getInfo()) / Number(e.getChildren()[1].getInfo())));
                    break;
                case '^' :
                    tree.exchangeChild(e, new Node(Math.pow(Number(e.getChildren()[0].getInfo()), Number(e.getChildren()[1].getInfo()))));
                    break;
                default : break;
            }
        });
    }
    //루트 노드를 숫자로 형변환
    tree.getRoot().merge('info', Number(tree.getRoot().getInfo()));


    console.log(tree.getRoot())
    //루트 노드의 정보가 NaN인지 검사하여 NaN이라면 예기치 못한 오류로 처리
    if(Number.isNaN(tree.getRoot().getInfo())) return "Unexpected Result";

    //결과 반환
    return tree.getRoot().getInfo();
}

export default Expression;