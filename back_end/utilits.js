import bcrypt from 'bcrypt';

export async function CriarHash(senha, salts){
    //Transformando a senha de texto para hash
    const hash = await bcrypt.hash(senha, salts);
    console.log(hash);
    return hash;
}


export async function CompararHash(senha, hash){
    //Compara a senha original com o hash salvo
    const teste = await bcrypt.compare(senha, hash);
    if(teste){
        return true
    }
    else{
        return false
    }
}



